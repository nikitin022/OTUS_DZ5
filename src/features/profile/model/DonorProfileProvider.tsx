import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Donor } from '../../../types';
import {
  DONOR_PROFILE_STORAGE_KEY,
  DonorProfileContext,
  loadDonorFromStorage,
} from './profileContext';
import { isBackendEnabled } from '../../../api/supabase/config';
import {
  loadOwnDonor,
  requestOtp,
  signOut as supabaseSignOut,
  upsertOwnDonor,
  verifyOtp,
} from '../../../api/supabase/auth';

/**
 * Профиль донора (FR-1). Гость = null (FR-1.4).
 *
 * Backend-режим (заданы VITE_SUPABASE_*): профиль живёт в таблице donors,
 * вход — телефон + OTP; saveDonor без сессии отправляет код и возвращает false,
 * после confirmOtp профиль создаётся через RPC register_donor_profile.
 * Mock-режим (unit-тесты, dev без бэкенда): localStorage, синхронное сохранение.
 */
export function DonorProfileProvider({ children }: { children: ReactNode }) {
  const [donor, setDonor] = useState<Donor | null>(() =>
    isBackendEnabled ? null : loadDonorFromStorage(),
  );
  const [initializing, setInitializing] = useState<boolean>(isBackendEnabled);
  const [pendingOtpPhone, setPendingOtpPhone] = useState<string | null>(null);
  // Профиль, заполненный в форме до подтверждения OTP
  const pendingProfileRef = useRef<Donor | null>(null);

  // Backend-режим: восстановление сессии и профиля при загрузке приложения
  useEffect(() => {
    if (!isBackendEnabled) return;
    let cancelled = false;
    loadOwnDonor()
      .then((own) => {
        if (!cancelled) setDonor(own);
      })
      .catch(() => {
        // Ошибка восстановления сессии трактуется как гость
        if (!cancelled) setDonor(null);
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveDonor = useCallback(async (next: Donor): Promise<boolean> => {
    if (!isBackendEnabled) {
      localStorage.setItem(DONOR_PROFILE_STORAGE_KEY, JSON.stringify(next));
      setDonor(next);
      return true;
    }
    // Ошибки (формат телефона, провайдер SMS не настроен и т.п.) обрабатывает форма
    const session = await loadOwnDonor();
    if (session) {
      // Сессия есть — сохраняем/обновляем профиль через RPC
      const saved = await upsertOwnDonor(next);
      setDonor(saved);
      return true;
    }
    // Гость: отправляем OTP-код на указанный телефон
    pendingProfileRef.current = next;
    await requestOtp(next.phone);
    setPendingOtpPhone(next.phone);
    return false;
  }, []);

  const confirmOtp = useCallback(async (code: string): Promise<boolean> => {
    if (!isBackendEnabled || !pendingProfileRef.current) return false;
    const profile = pendingProfileRef.current;
    // Неверный или просроченный код — форма показывает ошибку, шаг сохраняется
    await verifyOtp(profile.phone, code);
    // Сессия создана — сохраняем профиль (RPC, идемпотентно)
    const saved = await upsertOwnDonor(profile);
    setDonor(saved);
    pendingProfileRef.current = null;
    setPendingOtpPhone(null);
    return true;
  }, []);

  const clearDonor = useCallback(() => {
    if (isBackendEnabled) {
      void supabaseSignOut();
    } else {
      localStorage.removeItem(DONOR_PROFILE_STORAGE_KEY);
    }
    pendingProfileRef.current = null;
    setPendingOtpPhone(null);
    setDonor(null);
  }, []);

  const value = useMemo(
    () => ({ donor, saveDonor, confirmOtp, pendingOtpPhone, initializing, clearDonor }),
    [donor, saveDonor, confirmOtp, pendingOtpPhone, initializing, clearDonor],
  );

  return <DonorProfileContext.Provider value={value}>{children}</DonorProfileContext.Provider>;
}