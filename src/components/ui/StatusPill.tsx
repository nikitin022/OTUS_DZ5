import { Badge } from './Badge';

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'missed';
type RequestStatus = 'active' | 'closed';

const appointmentLabels: Record<
  AppointmentStatus,
  { label: string; tone: 'neutral' | 'warning' | 'success' | 'danger' }
> = {
  pending: { label: 'Ожидает подтверждения', tone: 'warning' },
  confirmed: { label: 'Подтверждена', tone: 'success' },
  cancelled: { label: 'Отменена', tone: 'neutral' },
  missed: { label: 'Не состоялась', tone: 'danger' },
};

const requestLabels: Record<RequestStatus, { label: string; tone: 'success' | 'neutral' }> = {
  active: { label: 'Активна', tone: 'success' },
  closed: { label: 'Закрыта', tone: 'neutral' },
};

/** Метка статуса записи на донацию. */
export function AppointmentStatusPill({ status }: { status: AppointmentStatus }) {
  const { label, tone } = appointmentLabels[status];
  return <Badge tone={tone}>{label}</Badge>;
}

/** Метка статуса заявки (FR-8.2). */
export function RequestStatusPill({ status }: { status: RequestStatus }) {
  const { label, tone } = requestLabels[status];
  return <Badge tone={tone}>{label}</Badge>;
}
