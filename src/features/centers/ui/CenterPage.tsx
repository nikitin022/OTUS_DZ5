import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { PageGate } from '../../../components/ui/PageGate';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LinkButton } from '../../../components/ui/LinkButton';
import { useCenter, useRequests } from '../../../api/hooks';
import { getOpenStatus } from '../../../lib/workingHours';
import { formatBloodGroup } from '../../../lib/bloodGroups';
import { buildRouteUrl } from '../../../lib/maps';

const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

/**
 * Карточка центра крови (FR-2.3/2.4): адрес, график, телефон,
 * нужные группы, «Записаться» и «Построить маршрут».
 */
export function CenterPage() {
  const { centerId } = useParams<{ centerId: string }>();

  const { centersQuery, center } = useCenter(centerId);
  const requestsQuery = useRequests();

  const neededGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const request of requestsQuery.data ?? []) {
      if (request.centerId === centerId && request.status === 'active') {
        groups.add(formatBloodGroup(request.bloodGroup, request.rhFactor));
      }
    }
    return [...groups];
  }, [requestsQuery.data, centerId]);

  return (
    <div>
      <PageGate
        queries={[centersQuery]}
        header={<PageHeader title="Центр крови" showBack />}
        skeleton={<Skeleton className="h-64 w-full" />}
        errorMessage="Не удалось загрузить данные центра."
      >
        {center ? (
          <CenterDetails center={center} neededGroups={neededGroups} />
        ) : (
          <EmptyState
            icon="🏥"
            title="Центр не найден"
            description="Возможно, данные устарели. Вернитесь к карте и выберите центр заново."
            action={<LinkButton to="/map">На карту</LinkButton>}
          />
        )}
      </PageGate>
    </div>
  );
}

function CenterDetails({
  center,
  neededGroups,
}: {
  center: NonNullable<ReturnType<typeof useCenter>['center']>;
  neededGroups: string[];
}) {
  const openStatus = getOpenStatus(center.workingHours);

  return (
    <div>
      <PageHeader title={center.name} showBack />

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {center.isVerified && <Badge tone="success">Проверенный центр</Badge>}
          <Badge tone={openStatus.isOpen ? 'success' : 'neutral'}>{openStatus.label}</Badge>
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-ink-600">Адрес</dt>
            <dd className="font-medium text-ink-900">{center.address}</dd>
          </div>
          <div>
            <dt className="text-ink-600">Телефон</dt>
            <dd className="font-medium text-ink-900">
              <a
                href={`tel:${center.phone.replace(/[^+\d]/g, '')}`}
                className="text-primary-700 hover:underline"
              >
                {center.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-ink-600">График работы</dt>
            <dd>
              <ul className="mt-1 space-y-0.5">
                {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                  const hours = center.workingHours[day];
                  return (
                    <li key={day} className="flex gap-3">
                      <span className="w-8 text-ink-600">{DAY_LABELS[day]}</span>
                      <span className={hours ? 'font-medium text-ink-900' : 'text-ink-600'}>
                        {hours ? hours.replace('-', '–') : 'выходной'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </dd>
          </div>
          <div>
            <dt className="text-ink-600">Нужные группы крови</dt>
            <dd className="mt-1">
              {neededGroups.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {neededGroups.map((group) => (
                    <Badge key={group} tone="danger">
                      {group}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-ink-600">Активных заявок нет</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <LinkButton to={`/centers/${center.id}/book`}>Записаться</LinkButton>
          <LinkButton href={buildRouteUrl(center)} target="_blank" rel="noreferrer" variant="secondary">
            Построить маршрут
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
