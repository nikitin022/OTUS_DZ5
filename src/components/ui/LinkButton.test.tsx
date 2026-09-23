import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LinkButton } from './LinkButton';

function renderLinkButton(props: Parameters<typeof LinkButton>[0]) {
  return render(
    <MemoryRouter>
      <LinkButton {...props} />
    </MemoryRouter>,
  );
}

describe('LinkButton — единые стили кнопки для ссылок', () => {
  it('внутренний маршрут рендерится как react-router Link', () => {
    renderLinkButton({ to: '/map', children: 'На карту' });

    const link = screen.getByRole('link', { name: 'На карту' });
    expect(link).toHaveAttribute('href', '/map');
    // Классы вариантов общие с Button (UI-кит)
    expect(link.className).toContain('bg-primary-700');
    expect(link.className).toContain('min-h-11');
  });

  it('внешний адрес рендерится как обычный <a>', () => {
    renderLinkButton({
      href: 'https://yandex.ru/maps/',
      target: '_blank',
      rel: 'noreferrer',
      variant: 'secondary',
      children: 'Маршрут',
    });

    const link = screen.getByRole('link', { name: 'Маршрут' });
    expect(link).toHaveAttribute('href', 'https://yandex.ru/maps/');
    expect(link).toHaveAttribute('target', '_blank');
    // secondary-вариант: рамка вместо заливки
    expect(link.className).toContain('border-primary-700');
    expect(link.className).not.toContain('bg-primary-700');
  });

  it('дополнительный className добавляется к базовым стилям', () => {
    renderLinkButton({ to: '/feed', className: 'w-full mt-5', children: 'Далее' });

    expect(screen.getByRole('link', { name: 'Далее' }).className).toContain('w-full');
  });
});