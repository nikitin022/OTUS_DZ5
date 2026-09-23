import { useMemo, useState } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { useCenters, useRequests } from '../../../api/hooks';
import { useUserCoords } from '../../geo/model/useUserCoords';
import { distanceKm } from '../../../lib/geo';
import { RequestCard } from './RequestCard';
import { FeedFiltersBar, type FeedFilters } from './FeedFiltersBar';

const PAGE_SIZE = 5;

/**
 * Живая лента потребностей (FR-3): заявки с фильтрами, автообновлением
 * и пагинацией «Показать ещё».
 */
export function FeedPage() {
  const { coords: userCoords } = useUserCoords();
  const [filters, setFilters] = useState<FeedFilters>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const requestsQuery = useRequests();
  const centersQuery = useCenters();

  const centersById = useMemo(
    () => new Map((centersQuery.data ?? []).map((center) => [center.id, center])),
    [centersQuery.data],
  );

  const activeRequests = useMemo(
    () => (requestsQuery.data ?? []).filter((r) => r.status === 'active'),
    [requestsQuery.data],
  );

  const filteredRequests = useMemo(
    () =>
      activeRequests.filter(
        (request) =>
          (!filters.bloodGroup || request.bloodGroup === filters.bloodGroup) &&
          (!filters.urgency || request.urgency === filters.urgency),
      ),
    [activeRequests, filters],
  );

  const visibleRequests = filteredRequests.slice(0, visibleCount);
  const hasMore = filteredRequests.length > visibleCount;

  // Сбой автообновления (FR-3.3): данные уже загружены, показываем плашку
  // «Данные устарели» с ручным обновлением вместо полного баннера ошибки загрузки
  const hasRequests = requestsQuery.data !== undefined;
  const hasFailed = requestsQuery.isError || centersQuery.isError;
  const isStale =
    hasRequests &&
    (hasFailed || requestsQuery.isRefetchError || centersQuery.isRefetchError);
  const isBlockingError = hasFailed && !hasRequests;

  function refetchAll() {
    void requestsQuery.refetch();
    void centersQuery.refetch();
  }

  function handleFiltersChange(next: FeedFilters) {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div>
      <PageHeader title="Лента потребностей" />

      <FeedFiltersBar filters={filters} onChange={handleFiltersChange} />

      {requestsQuery.isPending || centersQuery.isPending ? (
        <div aria-busy="true" aria-label="Загрузка заявок" className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      ) : isBlockingError ? (
        <ErrorBanner
          message="Не удалось загрузить заявки. Проверьте соединение."
          onRetry={refetchAll}
        />
      ) : (
        <>
          {isStale && (
            <div className="mb-3">
              <ErrorBanner
                message="Данные могли устареть: ленту не удалось обновить автоматически."
                retryLabel="Обновить сейчас"
                onRetry={refetchAll}
              />
            </div>
          )}

          {filteredRequests.length === 0 ? (
            <EmptyState
              icon="💧"
              title="Ничего не найдено"
              description="По выбранным фильтрам активных заявок нет. Попробуйте изменить условия."
              action={
                <Button variant="secondary" onClick={() => handleFiltersChange({})}>
                  Сбросить фильтры
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3" aria-label="Активные заявки">
              {visibleRequests.map((request) => (
                <li key={request.id}>
                  <RequestCard
                    request={request}
                    center={centersById.get(request.centerId)}
                    distance={
                      userCoords && centersById.get(request.centerId)
                        ? distanceKm(userCoords, centersById.get(request.centerId)!.coordinates)
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Показать ещё
              </Button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-ink-600">
            Лента обновляется автоматически каждые 45 секунд
          </p>
        </>
      )}
    </div>
  );
}
