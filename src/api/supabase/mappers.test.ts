import { describe, expect, it } from 'vitest';
import {
  appointmentPatchToRow,
  bloodRequestPatchToRow,
  toAppointment,
  toBloodRequest,
  toCenter,
  toDonationHistory,
  toDonor,
  type AppointmentRow,
  type BloodRequestRow,
  type CenterRow,
  type DonationHistoryRow,
  type DonorRow,
} from './mappers';

const donorRow: DonorRow = {
  id: 'd-1',
  auth_user_id: 'u-1',
  phone: '+79001234567',
  blood_group: '2',
  rh_factor: '-',
  search_radius_km: 100,
  consent_geolocation: true,
  consent_push: false,
  last_donation_at: '2026-08-01T10:00:00Z',
};

describe('toDonor', () => {
  it('маппирует snake_case в модель Donor (consents — вложенный объект)', () => {
    const donor = toDonor(donorRow);
    expect(donor).toEqual({
      id: 'd-1',
      phone: '+79001234567',
      bloodGroup: '2',
      rhFactor: '-',
      searchRadiusKm: 100,
      consents: { geolocation: true, push: false },
      lastDonationAt: '2026-08-01T10:00:00Z',
    });
  });
});

describe('toCenter', () => {
  it('собирает coordinates из latitude/longitude и ключи графика делает числовыми', () => {
    const row: CenterRow = {
      id: 'c-1',
      name: 'Центр крови',
      address: 'г. Москва, ул. Тестовая, 1',
      latitude: 55.7,
      longitude: 37.6,
      working_hours: { '0': 'выходной', '1': '08:00-13:00' },
      phone: '+7 495 000-00-00',
      is_verified: true,
    };
    const center = toCenter(row);
    expect(center.coordinates).toEqual([55.7, 37.6]);
    expect(center.workingHours[0]).toBe('выходной');
    expect(center.workingHours[1]).toBe('08:00-13:00');
    expect(Object.keys(center.workingHours)).toEqual(['0', '1']);
    expect(center.isVerified).toBe(true);
  });

  it('null в working_hours даёт пустой график', () => {
    const row: CenterRow = {
      id: 'c-2',
      name: 'Центр',
      address: 'адрес',
      latitude: 0,
      longitude: 0,
      working_hours: null,
      phone: '',
      is_verified: false,
    };
    expect(toCenter(row).workingHours).toEqual({});
  });
});

describe('toBloodRequest', () => {
  it('маппирует заявку ленты', () => {
    const row: BloodRequestRow = {
      id: 'r-1',
      center_id: 'c-1',
      blood_group: '1',
      rh_factor: '+',
      volume_ml: 900,
      urgency: 'срочная',
      collected_ml: 450,
      status: 'active',
      created_at: '2026-09-01T08:00:00Z',
      updated_at: '2026-09-02T08:00:00Z',
    };
    expect(toBloodRequest(row)).toEqual({
      id: 'r-1',
      centerId: 'c-1',
      bloodGroup: '1',
      rhFactor: '+',
      volumeMl: 900,
      urgency: 'срочная',
      collectedMl: 450,
      status: 'active',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-02T08:00:00Z',
    });
  });
});

describe('toAppointment', () => {
  it('обрезает время до HH:mm', () => {
    const row: AppointmentRow = {
      id: 'a-1',
      donor_id: 'd-1',
      center_id: 'c-1',
      date: '2026-11-01',
      time: '10:00:00',
      status: 'pending',
    };
    expect(toAppointment(row).time).toBe('10:00');
  });
});

describe('toDonationHistory', () => {
  it('извлекает centerName из вложенного centers(name)', () => {
    const row: DonationHistoryRow = {
      id: 'h-1',
      donor_id: 'd-1',
      center_id: 'c-1',
      date: '2026-08-01',
      volume_ml: 450,
      type: 'цельная кровь',
      status: 'завершена',
      centers: { name: 'Центр крови ФМБА России' },
    };
    const entry = toDonationHistory(row);
    expect(entry.centerName).toBe('Центр крови ФМБА России');
    expect(entry.type).toBe('цельная кровь');
  });

  it('без join centerName — пустая строка', () => {
    const row: DonationHistoryRow = {
      id: 'h-2',
      donor_id: 'd-1',
      center_id: 'c-x',
      date: '2026-08-02',
      volume_ml: 450,
      type: 'плазма',
      status: 'отменена',
      centers: null,
    };
    expect(toDonationHistory(row).centerName).toBe('');
  });
});

describe('патчи мутаций', () => {
  it('bloodRequestPatchToRow маппирует только заданные поля', () => {
    expect(bloodRequestPatchToRow({ status: 'closed', collectedMl: 900 })).toEqual({
      status: 'closed',
      collected_ml: 900,
    });
    expect(bloodRequestPatchToRow({})).toEqual({});
  });

  it('appointmentPatchToRow маппирует дату/время/статус', () => {
    expect(appointmentPatchToRow({ status: 'cancelled' })).toEqual({ status: 'cancelled' });
    expect(appointmentPatchToRow({ date: '2026-11-02', time: '12:00' })).toEqual({
      date: '2026-11-02',
      time: '12:00',
    });
  });
});