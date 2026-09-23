import { beforeEach, describe, expect, it } from 'vitest';
import { MockApiClient } from './MockApiClient';

const client = new MockApiClient();

const donorId = 'donor-test';
const centerId = 'c-1';
/** Дата, позднее последней сидовой донации (30 дней назад) более чем на 60 дней */
const VALID_DATE = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 100);
  return date.toISOString().slice(0, 10);
})();
const SOON_DATE = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 10);
  return date.toISOString().slice(0, 10);
})();

beforeEach(() => {
  localStorage.clear();
});

describe('MockApiClient.createAppointment', () => {
  it('создаёт запись со статусом «Ожидает подтверждения» (FR-5.3)', async () => {
    const appointment = await client.createAppointment({
      donorId,
      centerId,
      date: VALID_DATE,
      time: '10:00',
    });
    expect(appointment.status).toBe('pending');
    expect(appointment.id).toBeTruthy();
  });

  it('отклоняет занятый слот: «Выберите другое время»', async () => {
    const input = { donorId, centerId, date: VALID_DATE, time: '10:00' };
    await client.createAppointment(input);
    await expect(client.createAppointment(input)).rejects.toMatchObject({
      code: 'SLOT_TAKEN',
      message: 'Выберите другое время',
    });
  });

  it('отклоняет запись раньше 60 дней: «Интервал не соблюдён» (FR-5.2)', async () => {
    await expect(
      client.createAppointment({
        donorId,
        centerId,
        date: SOON_DATE,
        time: '10:00',
      }),
    ).rejects.toMatchObject({
      code: 'INTERVAL_VIOLATION',
      message: 'Интервал не соблюдён',
    });
  });
});

describe('MockApiClient.getDonationHistory', () => {
  it('возвращает историю, отсортированную от свежих к старым', async () => {
    const history = await client.getDonationHistory(donorId);
    expect(history.length).toBeGreaterThan(0);
    for (let i = 1; i < history.length; i += 1) {
      expect(history[i - 1].date >= history[i].date).toBe(true);
    }
  });
});

describe('MockApiClient.getRequests', () => {
  it('возвращает заявки, отсортированные по времени обновления', async () => {
    const requests = await client.getRequests();
    expect(requests.length).toBeGreaterThan(0);
    for (let i = 1; i < requests.length; i += 1) {
      expect(requests[i - 1].updatedAt >= requests[i].updatedAt).toBe(true);
    }
  });

  it('применяет фильтры по группе и срочности (FR-3.2)', async () => {
    const filtered = await client.getRequests({
      bloodGroup: '2',
      urgency: 'критичная',
    });
    expect(filtered.length).toBeGreaterThan(0);
    for (const request of filtered) {
      expect(request.bloodGroup).toBe('2');
      expect(request.urgency).toBe('критичная');
    }
  });
});
