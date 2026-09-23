import type {
  Appointment,
  BloodRequest,
  Center,
  DonationHistoryEntry,
  Donor,
  RequestResponse,
} from '../../types';

/**
 * Маппинг строк БД (snake_case) в модели фронтенда (camelCase, src/types).
 * Схема БД описана в docs/database_schema.md; соответствие полей — раздел 3.
 */

export interface DonorRow {
  id: string;
  auth_user_id: string | null;
  phone: string;
  blood_group: string;
  rh_factor: string;
  search_radius_km: number;
  consent_geolocation: boolean;
  consent_push: boolean;
  last_donation_at: string | null;
}

export interface CenterRow {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  working_hours: Record<string, string> | null;
  phone: string;
  is_verified: boolean;
}

export interface BloodRequestRow {
  id: string;
  center_id: string;
  blood_group: string;
  rh_factor: string;
  volume_ml: number;
  urgency: string;
  collected_ml: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentRow {
  id: string;
  donor_id: string;
  center_id: string;
  date: string;
  time: string;
  status: string;
}

export interface RequestResponseRow {
  id: string;
  request_id: string;
  donor_id: string;
  created_at: string;
}

export interface DonationHistoryRow {
  id: string;
  donor_id: string;
  center_id: string;
  date: string;
  volume_ml: number;
  type: string;
  status: string;
  /** Вложенный объект из select 'centers(name)' */
  centers: { name: string } | null;
}

export function toDonor(row: DonorRow): Donor {
  return {
    id: row.id,
    phone: row.phone,
    bloodGroup: row.blood_group as Donor['bloodGroup'],
    rhFactor: row.rh_factor as Donor['rhFactor'],
    searchRadiusKm: row.search_radius_km,
    consents: {
      geolocation: row.consent_geolocation,
      push: row.consent_push,
    },
    lastDonationAt: row.last_donation_at,
  };
}

export function toCenter(row: CenterRow): Center {
  // jsonb хранит строковые ключи "0".."6" — приводим к числовым (0 = воскресенье)
  const workingHours: Record<number, string> = {};
  for (const [key, value] of Object.entries(row.working_hours ?? {})) {
    const day = Number(key);
    if (!Number.isNaN(day)) {
      workingHours[day] = value;
    }
  }
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    coordinates: [row.latitude, row.longitude],
    workingHours,
    phone: row.phone,
    isVerified: row.is_verified,
  };
}

export function toBloodRequest(row: BloodRequestRow): BloodRequest {
  return {
    id: row.id,
    centerId: row.center_id,
    bloodGroup: row.blood_group as BloodRequest['bloodGroup'],
    rhFactor: row.rh_factor as BloodRequest['rhFactor'],
    volumeMl: row.volume_ml,
    urgency: row.urgency as BloodRequest['urgency'],
    collectedMl: row.collected_ml,
    status: row.status as BloodRequest['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    donorId: row.donor_id,
    centerId: row.center_id,
    date: row.date,
    time: row.time.slice(0, 5), // 'HH:mm'
    status: row.status as Appointment['status'],
  };
}

export function toRequestResponse(row: RequestResponseRow): RequestResponse {
  return {
    id: row.id,
    requestId: row.request_id,
    donorId: row.donor_id,
    createdAt: row.created_at,
  };
}

export function toDonationHistory(row: DonationHistoryRow): DonationHistoryEntry {
  return {
    id: row.id,
    date: row.date,
    centerId: row.center_id,
    centerName: row.centers?.name ?? '',
    volumeMl: row.volume_ml,
    type: row.type as DonationHistoryEntry['type'],
    status: row.status as DonationHistoryEntry['status'],
  };
}

/** Патч заявки BloodRequest -> колонки blood_requests */
export function bloodRequestPatchToRow(patch: Partial<BloodRequest>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.centerId !== undefined) row.center_id = patch.centerId;
  if (patch.bloodGroup !== undefined) row.blood_group = patch.bloodGroup;
  if (patch.rhFactor !== undefined) row.rh_factor = patch.rhFactor;
  if (patch.volumeMl !== undefined) row.volume_ml = patch.volumeMl;
  if (patch.urgency !== undefined) row.urgency = patch.urgency;
  if (patch.collectedMl !== undefined) row.collected_ml = patch.collectedMl;
  if (patch.status !== undefined) row.status = patch.status;
  return row;
}

/** Патч записи Appointment -> колонки appointments */
export function appointmentPatchToRow(patch: Partial<Appointment>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.time !== undefined) row.time = patch.time;
  if (patch.status !== undefined) row.status = patch.status;
  return row;
}