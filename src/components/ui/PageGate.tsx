import type { ReactNode } from 'react';
import { ErrorBanner } from './ErrorBanner';

/** Минимальный структурный контракт результата useQuery (из TanStack Query) */
interface QueryLike {
  isPending: boolean;
  isError: boolean;
  refetch: () => unknown;
}

interface PageGateProps {
  /** Один или несколько запросов, от которых зависит контент */
  queries: QueryLike[];
  /** Шапка для состояний загрузки и ошибки; в состоянии успеха
   * шапку рендерит сам контент (у экранов она зависит от данных) */
  header?: ReactNode;
  /** Скелетон на время загрузки (например, `<Skeleton className="h-80 w-full" />`) */
  skeleton: ReactNode;
  /** Сообщение при ошибке сети (по умолчанию — текст ErrorBanner) */
  errorMessage?: string;
  /** Контент при успехе */
  children: ReactNode;
}

/**
 * Декларативные состояния экрана по матрице ошибок ТЗ (раздел 6):
 * загрузка → скелетон, ошибка → баннер с «Повторить», успех → контент.
 * Заменяет повторяющийся скаффолдинг isPending/isError в страницах.
 */
export function PageGate({
  queries,
  header,
  skeleton,
  errorMessage,
  children,
}: PageGateProps) {
  if (queries.some((query) => query.isPending)) {
    return (
      <>
        {header}
        <div aria-busy="true" aria-label="Загрузка данных">
          {skeleton}
        </div>
      </>
    );
  }

  const errored = queries.find((query) => query.isError);
  if (errored) {
    return (
      <>
        {header}
        <ErrorBanner
          message={errorMessage}
          onRetry={() => {
            for (const query of queries) {
              void query.refetch();
            }
          }}
        />
      </>
    );
  }

  return <>{children}</>;
}