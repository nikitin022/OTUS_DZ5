import type {
  Appointment,
  BloodRequest,
  Center,
  DonationHistoryEntry,
  RequestResponse,
} from '../types';

/**
 * Контракт API (раздел 8 ТЗ).
 * Mock-слой реализует этот интерфейс на localStorage; при появлении реального
 * бэкенда меняется только реализация, компоненты и хуки не затрагиваются.
 */

/** Ошибка API с человекочитаемым сообщением (раздел 6 ТЗ) */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ListParams {
  page?: number;
  pageSize?: number;
}

export interface RequestFilters extends ListParams {
  bloodGroup?: string;
  urgency?: string;
}

export interface ApiClient {
  /** FR-2: список центров с координатами и графиком */
  getCenters(): Promise<Center[]>;

  /** FR-3: список заявок (лента) с фильтрами и пагинацией */
  getRequests(filters?: RequestFilters): Promise<BloodRequest[]>;

  /** FR-7: публикация заявки координатором */
  createRequest(
    request: Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'collectedMl'>,
  ): Promise<BloodRequest>;

  /** FR-7: редактирование/закрытие заявки */
  updateRequest(id: string, patch: Partial<BloodRequest>): Promise<BloodRequest>;

  /** FR-5: создание записи на донацию */
  createAppointment(appointment: Omit<Appointment, 'id' | 'status'>): Promise<Appointment>;

  /** FR-5: отмена/перенос записи */
  updateAppointment(id: string, patch: Partial<Appointment>): Promise<Appointment>;

  /** FR-4: подписка на push (в MVP — регистрация в mock) */
  subscribeToPush(subscription: unknown): Promise<void>;

  /** FR-6: история донаций */
  getDonationHistory(donorId: string): Promise<DonationHistoryEntry[]>;

  /** FR-8: отклики на заявку */
  getRequestResponses(requestId: string): Promise<RequestResponse[]>;
}
