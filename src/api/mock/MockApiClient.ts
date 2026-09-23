import { ApiError, type ApiClient, type RequestFilters } from '../ApiClient';
import type {
  Appointment,
  BloodRequest,
  Center,
  DonationHistoryEntry,
  RequestResponse,
} from '../../types';
import { isDonationIntervalMet, validateVolumeMl } from '../../lib/validation';
import { applyFeedMutation, buildSeedDb, EXTRA_REQUEST_TEMPLATES, type MockDb } from './data';

const STORAGE_KEY = 'kaplya.mockDb';
const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 600;

function delay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadDb(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    // повреждённый кэш — пересоздаём сид
  }
  const db = buildSeedDb();
  saveDb(db);
  return db;
}

function saveDb(db: MockDb): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // localStorage недоступен — работаем в памяти
  }
}

/**
 * Mock-реализация контракта ApiClient (раздел 8 ТЗ) на localStorage.
 * Имитирует задержку сети; лента «живая» — прогресс заявок меняется между чтениями.
 * При появлении реального бэкенда меняется только выбор реализации в `client.ts`.
 */
export class MockApiClient implements ApiClient {
  async getCenters(): Promise<Center[]> {
    await delay();
    return loadDb().centers;
  }

  async getRequests(filters: RequestFilters = {}): Promise<BloodRequest[]> {
    await delay();
    const db = loadDb();
    // Имитация живых данных: прогресс и статусы меняются между чтениями
    db.requests = applyFeedMutation(db.requests, EXTRA_REQUEST_TEMPLATES, new Date());
    saveDb(db);

    let result = db.requests;
    if (filters.bloodGroup) {
      result = result.filter((r) => r.bloodGroup === filters.bloodGroup);
    }
    if (filters.urgency) {
      result = result.filter((r) => r.urgency === filters.urgency);
    }
    return [...result].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createRequest(
    request: Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'collectedMl'>,
  ): Promise<BloodRequest> {
    await delay();
    const volumeError = validateVolumeMl(request.volumeMl);
    if (volumeError) {
      throw new ApiError(volumeError, 'VALIDATION_ERROR');
    }
    const db = loadDb();
    const now = new Date().toISOString();
    const created: BloodRequest = {
      ...request,
      id: `r-${Date.now()}`,
      collectedMl: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    db.requests.unshift(created);
    saveDb(db);
    return created;
  }

  async updateRequest(id: string, patch: Partial<BloodRequest>): Promise<BloodRequest> {
    await delay();
    const db = loadDb();
    const request = db.requests.find((r) => r.id === id);
    if (!request) {
      throw new ApiError('Заявка не найдена', 'NOT_FOUND');
    }
    Object.assign(request, patch, { updatedAt: new Date().toISOString() });
    saveDb(db);
    return request;
  }

  async createAppointment(appointment: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> {
    await delay();
    const db = loadDb();

    const slotTaken = db.appointments.some(
      (a) =>
        a.centerId === appointment.centerId &&
        a.date === appointment.date &&
        a.time === appointment.time &&
        (a.status === 'pending' || a.status === 'confirmed'),
    );
    if (slotTaken) {
      throw new ApiError('Выберите другое время', 'SLOT_TAKEN');
    }

    // Интервал между донациями (FR-5.2): сравниваем с последней донацией
    const lastDonationAt =
      db.history
        .map((entry) => entry.date)
        .sort()
        .at(-1) ?? null;
    if (!isDonationIntervalMet(lastDonationAt, new Date(appointment.date))) {
      throw new ApiError('Интервал не соблюдён', 'INTERVAL_VIOLATION');
    }

    const created: Appointment = {
      ...appointment,
      id: `apt-${Date.now()}`,
      status: 'pending',
    };
    db.appointments.push(created);
    saveDb(db);
    return created;
  }

  async updateAppointment(id: string, patch: Partial<Appointment>): Promise<Appointment> {
    await delay();
    const db = loadDb();
    const appointment = db.appointments.find((a) => a.id === id);
    if (!appointment) {
      throw new ApiError('Запись не найдена', 'NOT_FOUND');
    }
    Object.assign(appointment, patch);
    saveDb(db);
    return appointment;
  }

  async subscribeToPush(): Promise<void> {
    await delay();
    // В MVP подписка не сохраняется на сервер — имитация успешной регистрации
  }

  async getDonationHistory(_donorId: string): Promise<DonationHistoryEntry[]> {
    await delay();
    // В mock история одинакова для любого донора — для демонстрации UI
    return [...loadDb().history].sort((a, b) => b.date.localeCompare(a.date));
  }

  async getRequestResponses(requestId: string): Promise<RequestResponse[]> {
    await delay();
    return loadDb().responses[requestId] ?? [];
  }
}
