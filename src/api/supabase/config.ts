import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Конфигурация Supabase. Клиент создаётся только при наличии переменных
 * окружения; без них (unit-тесты, dev без бэкенда) фронтенд работает на mock-слое.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

export const isBackendEnabled = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const supabase: SupabaseClient | null = isBackendEnabled
  ? createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: {
        // Сессия в localStorage: PWA переживает перезагрузку (FR-1.4)
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;