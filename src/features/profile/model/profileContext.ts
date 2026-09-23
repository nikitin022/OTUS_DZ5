import { createContext, useContext } from 'react';
import type { Donor } from '../../../types';

export const DONOR_PROFILE_STORAGE_KEY = 'kaplya.donorProfile';

export interface DonorProfileContextValue {
  /** null — гость (FR-1.4) */
  donor: Donor | null;
  /**
   * Сохранение профиля. Backend-режим: без сессии отправляет OTP-код и
   * возвращает false (ожидается confirmOtp); с сессией — upsert через RPC и true.
   * Mock-режим (тесты, dev без бэкенда): сохраняет в localStorage и сразу true.
   */
  saveDonor: (donor: Donor) => Promise<boolean>;
  /** Подтверждение OTP-кода; true — вход выполнен и профиль сохранён */
  confirmOtp: (code: string) => Promise<boolean>;
  /** Номер телефона, на который отправлен OTP-код (null — шаг не активен) */
  pendingOtpPhone: string | null;
  /** Восстановление сессии после загрузки страницы (backend-режим) */
  initializing: boolean;
  clearDonor: () => void;
}

export const DonorProfileContext = createContext<DonorProfileContextValue | undefined>(undefined);

/** Чтение профиля из localStorage; повреждённые данные трактуются как гость */
export function loadDonorFromStorage(): Donor | null {
  try {
    const raw = localStorage.getItem(DONOR_PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Donor) : null;
  } catch {
    return null;
  }
}

/** Доступ к профилю донора (FR-1). Гость = null (FR-1.4) */
export function useDonorProfile(): DonorProfileContextValue {
  const ctx = useContext(DonorProfileContext);
  if (!ctx) {
    throw new Error('useDonorProfile должен использоваться внутри DonorProfileProvider');
  }
  return ctx;
}