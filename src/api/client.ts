import type { ApiClient } from './ApiClient';
import { MockApiClient } from './mock/MockApiClient';
import { SupabaseApiClient } from './supabase/SupabaseApiClient';
import { isBackendEnabled } from './supabase/config';

/**
 * Точка доступа к API (контракт — раздел 8 ТЗ).
 * Реальный бэкенд (Supabase REST/RPC) включается переменными окружения
 * VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY; без них (unit-тесты,
 * dev без бэкенда) используется mock-слой на localStorage. Контракт и UI не меняются.
 */
export const apiClient: ApiClient = isBackendEnabled
  ? new SupabaseApiClient()
  : new MockApiClient();