import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { PageGate } from '../../../components/ui/PageGate';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LinkButton } from '../../../components/ui/LinkButton';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { UrgencyBadge } from '../../../components/ui/UrgencyBadge';
import { RequestStatusPill } from '../../../components/ui/StatusPill';
import { useCenter, useRequestResponses, useRequests } from '../../../api/hooks';
import { formatBloodGroup } from '../../../lib/bloodGroups';
import { formatRelativeTime, formatVolume } from '../../../lib/format';
import type { BloodRequest } from '../../../types';

/**
 * Карточка заявки (FR-4.3): цель диплинка из push-уведомления.
 * Показывает группу, объём, срочность, прогресс и счётчик откликов (FR-8.1).
 */
export function RequestPage() {
  const { requestId } = useParams<{ requestId: string }>();

  const requestsQuery = useRequests();
  const responsesQuery = useRequestResponses(requestId);

  const request = requestsQuery.data?.find((r) => r.id === requestId);
  const { centersQuery, center } = useCenter(request?.centerId);

  return (
    <div>
      <PageGate
        queries={[requestsQuery, centersQuery]}
        header={<PageHeader title="Заявка" showBack />}
        skeleton={<Skeleton className="h-64 w-full" />}
        errorMessage="Не удалось загрузить заявку."
      >
        <PageHeader title="Заявка" showBack />
        <RequestDetails
          request={request}
          center={center}
          responsesQuery={responsesQuery}
        />
      </PageGate>
    </div>
  );
}

interface RequestDetailsProps {
  request: BloodRequest | undefined;
  center: ReturnType<typeof useCenter>['center'];
  responsesQuery: ReturnType<typeof useRequestResponses>;
}

function RequestDetails({ request, center, responsesQuery }: RequestDetailsProps) {
  if (!request) {
    return (
      <EmptyState
        icon="💧"
        title="Заявка не найдена"
        description="Возможно, она уже закрыта или ссылка устарела."
        action={<LinkButton to="/feed">К ленте заявок</LinkButton>}
      />
    );
  }

  if (request.status === 'closed') {
    return (
      <div>
        <Card className="mb-4">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-ink-900">
              {formatBloodGroup(request.bloodGroup, request.rhFactor)}
            </p>
            <RequestStatusPill status="closed" />
          </div>
        </Card>
        <EmptyState
          icon="✅"
          title="Заявка закрыта"
          description="Потребность уже закрыта — спасибо всем, кто откликнулся!"
          action={<LinkButton to="/feed" variant="secondary">Другие заявки</LinkButton>}
        />
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-semibold text-ink-900">
          {formatBloodGroup(request.bloodGroup, request.rhFactor)}
        </p>
        <UrgencyBadge urgency={request.urgency} />
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-600">Объём</dt>
          <dd className="font-medium text-ink-900">{formatVolume(request.volumeMl)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-600">Собрано</dt>
          <dd className="font-medium text-ink-900">{formatVolume(request.collectedMl)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-600">Центр</dt>
          <dd className="font-medium">
            {center ? (
              <Link to={`/centers/${center.id}`} className="text-primary-700 hover:underline">
                {center.name}
              </Link>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-600">Обновлено</dt>
          <dd className="font-medium text-ink-900">{formatRelativeTime(request.updatedAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-600">Откликнулись</dt>
          <dd className="font-medium text-ink-900">
            {responsesQuery.data ? `${responsesQuery.data.length} чел.` : '…'}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <ProgressBar
          value={request.collectedMl}
          max={request.volumeMl}
          label="Прогресс сбора крови"
        />
      </div>

      <LinkButton
        to={`/centers/${request.centerId}/book`}
        className="mt-5 w-full"
      >
        Записаться на донацию
      </LinkButton>
    </Card>
  );
}
