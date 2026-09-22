import type { ApiClient } from './ApiClient';
import { MockApiClient } from './mock/MockApiClient';

/**
 * Точка доступа к API. Сейчас — mock-слой; при появлении реального бэкенда
 * меняется только эта строка, контракт ApiClient и весь UI остаются прежними.
 */
export const apiClient: ApiClient = new MockApiClient();
