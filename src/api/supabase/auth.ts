import type { Donor } from '../../types';
import { supabase } from './config';
import { toDonor, type DonorRow } from './mappers';

/**
 * Аутентификация (docs/authentication.md): телефон + OTP (Supabase Auth)
 * и операции с профилем донора (RPC register_donor_profile, FR-1).
 */

/** Приведение телефона к E.164: "+79001234567" */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  return '+' + digits;
}

function requireClient() {
  if (!supabase) {
    throw new Error('Бэкенд не настроен');
  }
  return supabase;
}

/** Отправка одноразового кода на телефон */
export async function requestOtp(phone: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.auth.signInWithOtp({ phone: normalizePhone(phone) });
  if (error) throw error;
}

/** Проверка кода и создание сессии */
export async function verifyOtp(phone: string, token: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.auth.verifyOtp({
    phone: normalizePhone(phone),
    token,
    type: 'sms',
  });
  if (error) throw error;
}

/** Выход из системы */
export async function signOut(): Promise<void> {
  const client = requireClient();
  await client.auth.signOut();
}

/** Профиль донора текущей сессии (null — нет сессии или профиля) */
export async function loadOwnDonor(): Promise<Donor | null> {
  const client = requireClient();
  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await client
    .from('donors')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? toDonor(data as DonorRow) : null;
}

/** Создание/обновление профиля через RPC (идемпотентно, FR-1) */
export async function upsertOwnDonor(donor: Omit<Donor, 'id' | 'lastDonationAt'>): Promise<Donor> {
  const client = requireClient();
  const { data, error } = await client.rpc('register_donor_profile', {
    p_phone: normalizePhone(donor.phone),
    p_blood_group: donor.bloodGroup,
    p_rh_factor: donor.rhFactor,
    p_search_radius_km: donor.searchRadiusKm,
    p_consent_geolocation: donor.consents.geolocation,
    p_consent_push: donor.consents.push,
  });
  if (error) throw error;
  return toDonor(data as DonorRow);
}