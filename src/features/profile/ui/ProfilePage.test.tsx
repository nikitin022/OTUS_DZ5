import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProfilePage } from './ProfilePage';
import { BookingPage } from '../../booking/ui/BookingPage';
import { RequireDonor } from '../../../components/routing/RequireDonor';
import { DonorProfileProvider } from '../model/DonorProfileProvider';

function renderPage(initialEntry: string | { pathname: string; state?: unknown } = '/profile') {
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

beforeEach(() => {
  localStorage.clear();
});

describe('ProfilePage — валидация (матрица ошибок ТЗ)', () => {
  it('пустой телефон, радиус 0 и отсутствие согласий дают ошибки', () => {
    renderPage('/profile');

    fireEvent.change(screen.getByLabelText('Радиус поиска, км'), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить профиль' }));

    expect(screen.getByText('Укажите номер телефона')).toBeInTheDocument();
    expect(screen.getByText('Радиус от 1 до 500 км')).toBeInTheDocument();
    expect(
      screen.getByText('Нужно явное согласие на геолокацию и уведомления'),
    ).toBeInTheDocument();
  });
});

describe('ProfilePage — сохранение профиля', () => {
  it('сохраняет профиль и возвращает к намерению (FR-1.4)', async () => {
    renderPage({
      pathname: '/profile',
      state: { from: '/centers/c-1/book' },
    });

    fireEvent.change(screen.getByLabelText('Номер телефона'), {
      target: { value: '+7 900 000-00-00' },
    });
    fireEvent.click(screen.getByLabelText('Разрешаю использовать геолокацию'));
    fireEvent.click(screen.getByLabelText('Разрешаю push-уведомления'));
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить профиль' }));

    // После сохранения донор авторизован — RequireDonor пропускает на запись
    expect(await screen.findByRole('heading', { name: 'Запись на донацию' })).toBeInTheDocument();
    // Регрессия: в заголовке — название центра из справочника, а не внутренний id
    expect(await screen.findByText('Центр крови им. О.К. Гаврилова')).toBeInTheDocument();
  });
});
