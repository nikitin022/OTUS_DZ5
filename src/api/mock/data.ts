import type {
  Appointment,
  BloodRequest,
  Center,
  DonationHistoryEntry,
  RequestResponse,
} from '../../types';

/** Сид-данные центров крови: приближённые координаты и графики (0 — воскресенье). */
export const SEED_CENTERS: Center[] = [
  {
    id: 'c-1',
    name: 'Центр крови им. О.К. Гаврилова',
    address: 'ул. Поликарпова, 14, Москва',
    coordinates: [55.7858, 37.5901],
    workingHours: {
      1: '08:00-17:00',
      2: '08:00-17:00',
      3: '08:00-17:00',
      4: '08:00-17:00',
      5: '08:00-16:45',
    },
    phone: '+7 495 945-33-19',
    isVerified: true,
  },
  {
    id: 'c-2',
    name: 'Станция переливания крови на Бакинской',
    address: 'ул. Бакинская, 31, Москва',
    coordinates: [55.7089, 37.6239],
    workingHours: {
      1: '08:00-14:00',
      2: '08:00-14:00',
      3: '08:00-14:00',
      4: '08:00-14:00',
      5: '08:00-14:00',
      6: '09:00-13:00',
    },
    phone: '+7 495 324-46-07',
    isVerified: true,
  },
  {
    id: 'c-3',
    name: 'Отделение переливания крови ГКБ №52',
    address: 'ул. Цюрупы, 16, Москва',
    coordinates: [55.843, 37.466],
    workingHours: {
      1: '09:00-18:00',
      2: '09:00-18:00',
      3: '09:00-18:00',
      4: '09:00-18:00',
      5: '09:00-18:00',
    },
    phone: '+7 499 196-36-71',
    isVerified: true,
  },
  {
    id: 'c-4',
    name: 'Центр крови ФМБА России',
    address: 'ул. Щипок, 6, Москва',
    coordinates: [55.7254, 37.6187],
    workingHours: {
      1: '08:30-15:30',
      2: '08:30-15:30',
      3: '08:30-15:30',
      4: '08:30-15:30',
      5: '08:30-15:30',
    },
    phone: '+7 495 954-02-11',
    isVerified: true,
  },
  {
    id: 'c-5',
    name: 'Отделение крови Восточного округа',
    address: 'Первомайская ул., 62, Москва',
    coordinates: [55.79, 37.798],
    workingHours: { 2: '09:00-16:00', 4: '09:00-16:00' },
    phone: '+7 495 367-21-45',
    isVerified: false,
  },
  {
    id: 'c-6',
    name: 'Центр крови Юго-Востока',
    address: 'Есенинский бульвар, 2, Москва',
    coordinates: [55.71, 37.745],
    workingHours: { 1: '09:00-17:00', 3: '09:00-17:00', 5: '09:00-17:00' },
    phone: '+7 495 371-88-12',
    isVerified: false,
  },
];

export interface RequestTemplate {
  centerId: string;
  bloodGroup: BloodRequest['bloodGroup'];
  rhFactor: BloodRequest['rhFactor'];
  volumeMl: number;
  urgency: BloodRequest['urgency'];
  /** Доля собранного объёма от 0 до 1; 1 — заявка уже закрыта */
  progress: number;
  /** Сколько минут назад обновлялась */
  minutesAgo: number;
}

/** Первичный набор заявок ленты */
export const REQUEST_TEMPLATES: RequestTemplate[] = [
  {
    centerId: 'c-1',
    bloodGroup: '2',
    rhFactor: '-',
    volumeMl: 900,
    urgency: 'критичная',
    progress: 0.5,
    minutesAgo: 12,
  },
  {
    centerId: 'c-3',
    bloodGroup: '1',
    rhFactor: '+',
    volumeMl: 450,
    urgency: 'срочная',
    progress: 0.8,
    minutesAgo: 35,
  },
  {
    centerId: 'c-2',
    bloodGroup: '4',
    rhFactor: '+',
    volumeMl: 1200,
    urgency: 'обычная',
    progress: 0.3,
    minutesAgo: 90,
  },
  {
    centerId: 'c-4',
    bloodGroup: '3',
    rhFactor: '-',
    volumeMl: 600,
    urgency: 'критичная',
    progress: 0.15,
    minutesAgo: 150,
  },
  {
    centerId: 'c-6',
    bloodGroup: '1',
    rhFactor: '-',
    volumeMl: 900,
    urgency: 'срочная',
    progress: 0.6,
    minutesAgo: 240,
  },
  {
    centerId: 'c-1',
    bloodGroup: '2',
    rhFactor: '+',
    volumeMl: 450,
    urgency: 'обычная',
    progress: 0.9,
    minutesAgo: 300,
  },
  {
    centerId: 'c-5',
    bloodGroup: '3',
    rhFactor: '+',
    volumeMl: 1500,
    urgency: 'срочная',
    progress: 0.25,
    minutesAgo: 420,
  },
  {
    centerId: 'c-4',
    bloodGroup: '1',
    rhFactor: '+',
    volumeMl: 450,
    urgency: 'обычная',
    progress: 1,
    minutesAgo: 600,
  },
  {
    centerId: 'c-6',
    bloodGroup: '4',
    rhFactor: '-',
    volumeMl: 600,
    urgency: 'срочная',
    progress: 1,
    minutesAgo: 720,
  },
];

/** Дополнительные заявки: «живая» лента периодически добавляет их как новые */
export const EXTRA_REQUEST_TEMPLATES: RequestTemplate[] = [
  {
    centerId: 'c-2',
    bloodGroup: '2',
    rhFactor: '-',
    volumeMl: 450,
    urgency: 'критичная',
    progress: 0.05,
    minutesAgo: 0,
  },
  {
    centerId: 'c-5',
    bloodGroup: '1',
    rhFactor: '+',
    volumeMl: 900,
    urgency: 'срочная',
    progress: 0.05,
    minutesAgo: 0,
  },
  {
    centerId: 'c-3',
    bloodGroup: '4',
    rhFactor: '+',
    volumeMl: 450,
    urgency: 'обычная',
    progress: 0.05,
    minutesAgo: 0,
  },
  {
    centerId: 'c-1',
    bloodGroup: '3',
    rhFactor: '-',
    volumeMl: 600,
    urgency: 'срочная',
    progress: 0.05,
    minutesAgo: 0,
  },
];

export function templateToRequest(template: RequestTemplate, id: string, now: Date): BloodRequest {
  const updatedAt = new Date(now.getTime() - template.minutesAgo * 60_000);
  return {
    id,
    centerId: template.centerId,
    bloodGroup: template.bloodGroup,
    rhFactor: template.rhFactor,
    volumeMl: template.volumeMl,
    urgency: template.urgency,
    collectedMl: Math.round(template.volumeMl * template.progress),
    status: template.progress >= 1 ? 'closed' : 'active',
    createdAt: updatedAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

export function buildSeedRequests(now: Date): BloodRequest[] {
  return REQUEST_TEMPLATES.map((template, index) =>
    templateToRequest(template, `r-${index + 1}`, now),
  );
}

/** История донаций для демонстрации (одна из донаций — 30 дней назад). */
export function buildSeedHistory(now: Date): DonationHistoryEntry[] {
  const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000).toISOString();
  return [
    {
      id: 'h-1',
      date: iso(30),
      centerId: 'c-1',
      centerName: 'Центр крови им. О.К. Гаврилова',
      volumeMl: 450,
      type: 'цельная кровь',
      status: 'завершена',
    },
    {
      id: 'h-2',
      date: iso(105),
      centerId: 'c-3',
      centerName: 'Отделение переливания крови ГКБ №52',
      volumeMl: 450,
      type: 'цельная кровь',
      status: 'завершена',
    },
    {
      id: 'h-3',
      date: iso(195),
      centerId: 'c-4',
      centerName: 'Центр крови ФМБА России',
      volumeMl: 450,
      type: 'цельная кровь',
      status: 'завершена',
    },
  ];
}

export function buildSeedResponses(now: Date): Record<string, RequestResponse[]> {
  const result: Record<string, RequestResponse[]> = {};
  REQUEST_TEMPLATES.forEach((_, index) => {
    const requestId = `r-${index + 1}`;
    const count = (index % 4) + 2;
    result[requestId] = Array.from({ length: count }, (_, j) => ({
      id: `resp-${index + 1}-${j + 1}`,
      requestId,
      donorId: `demo-donor-${j + 1}`,
      createdAt: new Date(now.getTime() - (j + 1) * 3_600_000).toISOString(),
    }));
  });
  return result;
}

/**
 * «Живая» мутация ленты: у активной заявки растёт прогресс, заполненные
 * закрываются (FR-7.2), изредка появляется новая заявка. Чистая функция
 * с внедряемым генератором случайных чисел — удобно для тестов.
 */
export function applyFeedMutation(
  requests: BloodRequest[],
  extraTemplates: RequestTemplate[],
  now: Date,
  random: () => number = Math.random,
): BloodRequest[] {
  const result = requests.map((request) => ({ ...request }));
  const active = result.filter((request) => request.status === 'active');

  if (active.length > 0 && random() < 0.5) {
    const target = active[Math.floor(random() * active.length)];
    target.collectedMl = Math.min(
      target.volumeMl,
      target.collectedMl + 150 + Math.floor(random() * 300),
    );
    target.updatedAt = now.toISOString();
    if (target.collectedMl >= target.volumeMl) {
      target.status = 'closed';
    }
  }

  if (extraTemplates.length > 0 && result.length < 30 && random() < 0.2) {
    const template = extraTemplates[Math.floor(random() * extraTemplates.length)];
    result.unshift(
      templateToRequest(template, `r-${now.getTime()}-${Math.floor(random() * 1000)}`, now),
    );
  }

  return result;
}

export interface MockDb {
  centers: Center[];
  requests: BloodRequest[];
  appointments: Appointment[];
  responses: Record<string, RequestResponse[]>;
  history: DonationHistoryEntry[];
}

export function buildSeedDb(now: Date = new Date()): MockDb {
  return {
    centers: SEED_CENTERS,
    requests: buildSeedRequests(now),
    appointments: [],
    responses: buildSeedResponses(now),
    history: buildSeedHistory(now),
  };
}
