import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { BloodRequest, Center } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { UrgencyBadge } from '../../../components/ui/UrgencyBadge';
import { RequestStatusPill } from '../../../components/ui/StatusPill';
import { formatBloodGroup } from '../../../lib/bloodGroups';
import { formatDistance, formatRelativeTime, formatVolume } from '../../../lib/format';

interface RequestCardProps {
  request: BloodRequest;
  center?: Center;
  /** Расстояние от донора до центра, км */
  distance?: number;
}

/**
 * Карточка заявки в живой ленте (FR-3.1): группа, объём, срочность,
 * расстояние, прогресс, время обновления.
 * Обёрнута в memo: при тиках автообновления перерисовываются только
 * изменившиеся заявки, а не весь список.
 */
export const RequestCard = memo(function RequestCard({
  request,
  center,
  distance,
}: RequestCardProps) {
  const remaining = request.volumeMl - request.collectedMl;
  const isClosed = request.status === 'closed';

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-ink-900">
            {formatBloodGroup(request.bloodGroup, request.rhFactor)}
          </p>
          <p className="text-xs text-ink-600">
            {center?.name ?? 'Центр крови'}
            {distance !== undefined && ` · ${formatDistance(distance)}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <UrgencyBadge urgency={request.urgency} />
          {isClosed && <RequestStatusPill status="closed" />}
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar
          value={request.collectedMl}
          max={request.volumeMl}
          label={`Собрано ${formatVolume(request.collectedMl)} из ${formatVolume(request.volumeMl)}`}
        />
        <div className="mt-1 flex justify-between text-xs text-ink-600">
          <span>
            {isClosed ? 'Объём собран — спасибо!' : `Осталось ${formatVolume(remaining)}`}
          </span>
          <span>{formatRelativeTime(request.updatedAt)}</span>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Link
          to={`/requests/${request.id}`}
          className="text-sm font-medium text-primary-700 underline-offset-2 hover:underline"
        >
          Подробнее
        </Link>
      </div>
    </Card>
  );
});
