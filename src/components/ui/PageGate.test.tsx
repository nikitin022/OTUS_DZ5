import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageGate } from './PageGate';

interface QueryStubOptions {
  isPending?: boolean;
  isError?: boolean;
}

function queryStub({ isPending = false, isError = false }: QueryStubOptions = {}) {
  return {
    isPending,
    isError,
    refetch: vi.fn(),
  };
}

function renderGate(queries: Parameters<typeof PageGate>[0]['queries'], content: ReactNode = 'Контент') {
  return render(
    <PageGate
      queries={queries}
      header={<h1>Заголовок экрана</h1>}
      skeleton={<div data-testid="skeleton" />}
      errorMessage="Не удалось загрузить данные."
    >
      {content}
    </PageGate>,
  );
}

describe('PageGate — состояния экрана по матрице ошибок ТЗ', () => {
  it('загрузка: шапка + скелетон, контент скрыт', () => {
    renderGate([queryStub({ isPending: true })]);

    expect(screen.getByRole('heading', { name: 'Заголовок экрана' })).toBeInTheDocument();
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Контент')).not.toBeInTheDocument();
  });

  it('ошибка: шапка + баннер с «Повторить», повтор перезапускает все запросы', () => {
    const first = queryStub({ isError: true });
    const second = queryStub({ isError: true });
    renderGate([first, second]);

    expect(
      screen.getByText('Не удалось загрузить данные.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Контент')).not.toBeInTheDocument();

    screen.getByRole('button', { name: 'Повторить' }).click();

    expect(first.refetch).toHaveBeenCalledTimes(1);
    expect(second.refetch).toHaveBeenCalledTimes(1);
  });

  it('успех: контент отображается без шапки из PageGate (шапку рендерит контент)', () => {
    renderGate([queryStub(), queryStub()], <h1>Шапка контента</h1>);

    // header-проп не рендерится в состоянии успеха
    expect(screen.queryByRole('heading', { name: 'Заголовок экрана' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Шапка контента' })).toBeInTheDocument();
    expect(screen.queryByText('Контент')).not.toBeInTheDocument();
    expect(screen.getByText('Шапка контента')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Повторить' })).not.toBeInTheDocument();
  });
});