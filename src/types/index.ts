/**
 * Модели данных MVP (раздел 7 ТЗ).
 * Все сущности типизированы; mock-слой и будущий реальный бэкенд работают с этими же типами.
 */

export type BloodGroup = '1' | '2' | '3' | '4';

export type RhFactor = '+' | '-';

export type Urgency = 'обычная' | 'срочная' | 'критичная';

/** Донор (сущность «Донор») */
export interface Donor {
  id: string;
  phone: string;
  bloodGroup: BloodGroup;
  rhFactor: RhFactor;
  /** Радиус поиска центров, км (1-500) */
  searchRadiusKm: number;
  /** Явные согласия (FR-1.2) */
  consents: {
    geolocation: boolean;
    push: boolean;
  };
  /** Дата последней донации (ISO), если была */
  lastDonationAt: string | null;
}

/** Центр крови (сущность «Центр») */
export interface Center {
  id: string;
  name: string;
  address: string;
  /** Координаты [широта, долгота] */
  coordinates: [number, number];
  /** График работы по дням недели, 0 = воскресенье */
  workingHours: Record<number, string>;
  phone: string;
  isVerified: boolean;
}

/** Заявка на кровь (сущность «Заявка (потребность)») */
export interface BloodRequest {
  id: string;
  centerId: string;
  bloodGroup: BloodGroup;
  rhFactor: RhFactor;
  /** Требуемый объём, мл */
  volumeMl: number;
  urgency: Urgency;
  /** Прогресс сбора, мл */
  collectedMl: number;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

/** Запись на донацию (сущность «Запись») */
export interface Appointment {
  id: string;
  donorId: string;
  centerId: string;
  date: string;
  /** Время слота, HH:mm */
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'missed';
}

/** Отклик на заявку (сущность «Отклик») */
export interface RequestResponse {
  id: string;
  requestId: string;
  donorId: string;
  createdAt: string;
}

/** Уведомление (сущность «Уведомление») */
export interface Notification {
  id: string;
  donorId: string;
  type: 'request' | 'reminder' | 'system';
  text: string;
  deliveryStatus: 'sent' | 'delivered' | 'failed';
  createdAt: string;
}

/** История донаций (FR-6) */
export interface DonationHistoryEntry {
  id: string;
  date: string;
  centerId: string;
  centerName: string;
  volumeMl: number;
  type: 'цельная кровь' | 'плазма' | 'тромбоциты' | 'эритроциты';
  status: 'завершена' | 'отменена' | 'не состоялась';
}
