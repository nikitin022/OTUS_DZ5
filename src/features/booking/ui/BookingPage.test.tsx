import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingPage } from './BookingPage';
import { ProfilePage } from '../../profile/ui/ProfilePage';
import { RequireDonor } from '../../../components/routing/RequireDonor';
import { DonorProfileProvider } from '../../profile/model/DonorProfileProvider';
import { apiClient } from '../../../api/client';
import { ApiError } from '../../../api/ApiClient';
import type { Appointment, Center, Donor } from '../../../types';

vi.mock('../../../api/client', () => ({
  apiClient: {
    getRequests: vi.fn(),
    getCenters: vi.fn(),
    getDonationHistory: vi.fn(),
    getRequestResponses: vi.fn(),
    createRequest: vi.fn(),
    updateRequest: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    subscribeToPush: vi.fn(),
  },
}));

const mockCreateAppointment = vi.mocked(apiClient.createAppointment);
const mockGetCenters = vi.mocked(apiClient.getCenters);

const center: Center = {
  id: 'c-1',
  name: 'Центр крови им. О.К. Гаврилова',
  address: 'ул. Поликарпова, 14, Москва',
  coordinates: [55.7858, 37.5901],
  workingHours: { 1: '08:00-17:00' },
  phone: '+7 495 945-33-19',
  isVerified: true,
};

const donor: Donor = {
  id: 'd-1',
  phone: '+7 900 000-00-00',
  bloodGroup: '2',
  rhFactor: '-',
  searchRadiusKm: 50,
  consents: { geolocation: true, push: true },
  lastDonationAt: null,
};

const FUTURE_DATE = '2026-06-01';

function seedDonor() {
  localStorage.setItem('kaplya.donorProfile', JSON.stringify(donor));
}

function renderPage(initialEntry = '/centers/c-1/book') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <DonorProfileProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/centers/:centerId/book"
              element={
                <RequireDonor>
                  <BookingPage />
                </RequireDonor>
              }
            />
          </Routes>
        </MemoryRouter>
      </DonorProfileProvider>
    </QueryClientProvider>,
  );
}

async function fillAndSubmit() {
  fireEvent.change(await screen.findByLabelText('Дата донации'), {
    target: { value: FUTURE_DATE },
  });
  fireEvent.click(screen.getByRole('button', { name: '10:00' }));
  fireEvent.click(screen.getByRole('button', { name: 'Записаться' }));
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockGetCenters.mockResolvedValue([center]);
});

describe('BookingPage — доступ', () => {
  it('гость перенаправляется на профиль (FR-1.4)', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Профиль донора' })).toBeInTheDocument();
  });
});

describe('BookingPage — позитивный сценарий (FR-5.3)', () => {
  it('создаёт запись со статусом «Ожидает подтверждения»', async () => {
    seedDonor();
    const appointment: Appointment = {
      id: 'apt-1',
      donorId: donor.id,
      centerId: 'c-1',
      date: FUTURE_DATE,
      time: '10:00',
      status: 'pending',
    };
    mockCreateAppointment.mockResolvedValue(appointment);

    renderPage();
    await fillAndSubmit();

    expect(
      await screen.findByText('Запись создана — ожидает подтверждения центра'),
    ).toBeInTheDocument();
    expect(mockCreateAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        donorId: donor.id,
        centerId: 'c-1',
        date: FUTURE_DATE,
        time: '10:00',
      }),
    );
  });
});

describe('BookingPage — ошибки API (матрица ошибок ТЗ)', () => {
  it('занятый слот: «Выберите другое время»', async () => {
    seedDonor();
    mockCreateAppointment.mockRejectedValue(new ApiError('Выберите другое время', 'SLOT_TAKEN'));

    renderPage();
    await fillAndSubmit();

    expect(await screen.findByText('Выберите другое время')).toBeInTheDocument();
  });

  it('интервал < 60 дней: «Интервал не соблюдён» (FR-5.2)', async () => {
    seedDonor();
    mockCreateAppointment.mockRejectedValue(
      new ApiError('Интервал не соблюдён', 'INTERVAL_VIOLATION'),
    );

    renderPage();
    await fillAndSubmit();

    expect(await screen.findByText(/Интервал не соблюдён/)).toBeInTheDocument();
  });
});

describe('BookingPage — карточка центра (регрессия)', () => {
  it('показывает название и адрес центра, а не внутренний идентификатор', async () => {
    seedDonor();
    renderPage();

    expect(await screen.findByText(center.name)).toBeInTheDocument();
    expect(screen.getByText(center.address)).toBeInTheDocument();
    expect(screen.queryByText(/c-1/)).not.toBeInTheDocument();
  });
});

describe('BookingPage — валидация формы', () => {
  it('требует выбрать дату и время', async () => {
    seedDonor();
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Записаться' }));

    expect(screen.getByText('Выберите дату донации')).toBeInTheDocument();
  });
});
