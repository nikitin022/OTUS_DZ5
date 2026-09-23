import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Layout } from './Layout';

function renderLayout(initialPath = '/map') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/map" element={<p>Экран карты</p>} />
          <Route path="/feed" element={<p>Экран ленты</p>} />
          <Route path="/history" element={<p>Экран истории</p>} />
          <Route path="/profile" element={<p>Экран профиля</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout — адаптивная навигация', () => {
  it('рендерит обе навигации: нижнюю таб-панель (mobile) и меню в шапке (md+)', () => {
    renderLayout();

    const navs = screen.getAllByRole('navigation', {
      name: 'Основная навигация',
    });
    expect(navs).toHaveLength(2);

    // В DOM первым идёт menu в шапке (скрыто на мобильных), вторым — нижняя панель
    expect(navs[0].className).toContain('hidden md:block');
    // Нижняя панель скрыта на md+ (CSS-скрытие исключает её из a11y-дерева)
    expect(navs[1].className).toContain('md:hidden');

    // Одни и те же пункты в обеих навигациях
    const labels = ['Карта', 'Лента', 'История', 'Профиль'];
    for (const nav of navs) {
      for (const label of labels) {
        expect(
          Array.from(nav.querySelectorAll('a')).some(
            (link) => link.textContent === label,
          ),
        ).toBe(true);
      }
    }
  });

  it('помечает активный пункт aria-current=page и показывает экран', async () => {
    renderLayout('/feed');

    const active = screen
      .getAllByRole('navigation', { name: 'Основная навигация' })
      .flatMap((nav) => Array.from(nav.querySelectorAll('a[aria-current="page"]')));
    expect(active.map((link) => link.textContent)).toEqual(['Лента', 'Лента']);
    expect(screen.getByText('Экран ленты')).toBeInTheDocument();
  });

  it('переход по навигации меняет экран', async () => {
    renderLayout('/map');
    fireEvent.click(screen.getAllByText('Профиль')[0]);

    await waitFor(() =>
      expect(screen.getByText('Экран профиля')).toBeInTheDocument(),
    );
  });
});