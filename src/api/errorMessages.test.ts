import { describe, expect, it, vi } from 'vitest';
import { ApiError, type ApiClient } from './ApiClient';
import { NETWORK_ERROR_MESSAGE, toApiError, withNetworkErrorGuard } from './errorMessages';

describe('toApiError — маппинг кодов в UX-сообщения (матрица ошибок ТЗ)', () => {
  it('PGRST301 (JWT истёк) -> «Сессия истекла»', () => {
    const error = toApiError({ message: 'JWT expired', code: 'PGRST301' });
    expect(error.message).toBe('Сессия истекла. Войдите заново, чтобы продолжить.');
    expect(error.code).toBe('PGRST301');
  });

  it('42501 (нарушение RLS) -> «Недостаточно прав»', () => {
    const error = toApiError({
      message: 'new row violates row-level security policy for table "blood_requests"',
      code: '42501',
    });
    expect(error.message).toBe('Недостаточно прав для этого действия.');
  });

  it('23505 (unique) -> «Такая запись уже существует»', () => {
    const error = toApiError({
      message: 'duplicate key value violates unique constraint "request_responses_request_id_donor_id_key"',
      code: '23505',
    });
    expect(error.message).toBe('Такая запись уже существует.');
  });

  it('PGRST116 (0 или N строк вместо одной) -> «Запись не найдена»', () => {
    const error = toApiError({ message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' });
    expect(error.message).toBe('Запись не найдена или данные изменились.');
  });

  it('сообщение RPC на русском передаётся напрямую', () => {
    const error = toApiError({ message: 'Слот занят: выберите другое время', code: 'P0001' });
    expect(error.message).toBe('Слот занят: выберите другое время');
    expect(error.code).toBe('P0001');
  });

  it('без кода — сообщение как есть, код API_ERROR', () => {
    const error = toApiError({ message: 'Unknown failure' });
    expect(error.message).toBe('Unknown failure');
    expect(error.code).toBe('API_ERROR');
  });
});

describe('withNetworkErrorGuard — сетевые сбои в ApiError', () => {
  it('TypeError (fetch failed) -> ApiError NETWORK_ERROR с понятным сообщением', async () => {
    const client = {
      getCenters: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    } as unknown as ApiClient;
    await expect(withNetworkErrorGuard(client).getCenters()).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NETWORK_ERROR',
      message: NETWORK_ERROR_MESSAGE,
    });
  });

  it('бизнес-ошибки (ApiError) проходят без изменений', async () => {
    const original = new ApiError('Слот занят: выберите другое время', 'P0001');
    const client = { getCenters: vi.fn().mockRejectedValue(original) } as unknown as ApiClient;
    await expect(withNetworkErrorGuard(client).getCenters()).rejects.toBe(original);
  });

  it('успешные ответы проходят насквозь', async () => {
    const client = { getCenters: vi.fn().mockResolvedValue([]) } as unknown as ApiClient;
    await expect(withNetworkErrorGuard(client).getCenters()).resolves.toEqual([]);
  });
});