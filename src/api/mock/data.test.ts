import { describe, expect, it } from 'vitest';
import type { BloodRequest } from '../../types';
import {
  applyFeedMutation,
  buildSeedDb,
  EXTRA_REQUEST_TEMPLATES,
  templateToRequest,
  REQUEST_TEMPLATES,
} from './data';

const NOW = new Date('2026-03-09T12:00:00.000Z');

function makeRequest(overrides: Partial<BloodRequest> = {}): BloodRequest {
  return {
    id: 'r-test',
    centerId: 'c-1',
    bloodGroup: '2',
    rhFactor: '-',
    volumeMl: 1000,
    urgency: 'срочная',
    collectedMl: 100,
    status: 'active',
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

describe('applyFeedMutation', () => {
  it('увеличивает прогресс активной заявки', () => {
    const updated = applyFeedMutation([makeRequest()], EXTRA_REQUEST_TEMPLATES, NOW, () => 0.1);
    // при random()=0.1 также добавляется новая заявка в начало списка
    expect(updated).toHaveLength(2);
    const original = updated.find((r) => r.id === 'r-test')!;
    expect(original.collectedMl).toBeGreaterThan(100);
    expect(original.status).toBe('active');
  });

  it('закрывает заявку, когда собран весь объём', () => {
    const updated = applyFeedMutation(
      [makeRequest({ collectedMl: 900, volumeMl: 1000 })],
      [],
      NOW,
      () => 0.1,
    );
    expect(updated[0].collectedMl).toBeGreaterThanOrEqual(1000);
    expect(updated[0].status).toBe('closed');
  });

  it('добавляет новую заявку из пула дополнительных', () => {
    const updated = applyFeedMutation([], EXTRA_REQUEST_TEMPLATES, NOW, () => 0.1);
    expect(updated).toHaveLength(1);
    expect(updated[0].status).toBe('active');
  });

  it('ничего не меняет, если случайные значения выше порогов', () => {
    const original = makeRequest();
    const updated = applyFeedMutation([original], EXTRA_REQUEST_TEMPLATES, NOW, () => 0.9);
    expect(updated[0].collectedMl).toBe(100);
    expect(updated).toHaveLength(1);
  });
});

describe('buildSeedDb', () => {
  it('создаёт сид: центры, заявки, отклики и история', () => {
    const db = buildSeedDb(NOW);
    expect(db.centers.length).toBeGreaterThanOrEqual(5);
    expect(db.requests.length).toBe(REQUEST_TEMPLATES.length);
    expect(db.appointments).toHaveLength(0);
    // заявки с progress = 1 закрываются
    expect(db.requests.some((r) => r.status === 'closed')).toBe(true);
    expect(db.history).toHaveLength(3);
  });

  it('время обновления заявок отсчитывается от переданного момента', () => {
    const request = templateToRequest(REQUEST_TEMPLATES[0], 'r-x', NOW);
    expect(request.updatedAt).toBe(
      new Date(NOW.getTime() - REQUEST_TEMPLATES[0].minutesAgo * 60_000).toISOString(),
    );
  });
});
