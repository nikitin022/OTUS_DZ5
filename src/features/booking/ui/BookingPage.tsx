import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { PageGate } from '../../../components/ui/PageGate';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LinkButton } from '../../../components/ui/LinkButton';
import { useCenter, useCreateAppointment } from '../../../api/hooks';
import { useDonorProfile } from '../../profile/model/profileContext';
import { isDonationIntervalMet } from '../../../lib/validation';
import { formatDate, todayIsoDate } from '../../../lib/format';
import type { Appointment, Center, Donor } from '../../../types';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'];

/**
 * Запись на донацию (FR-5): дата и слот времени, проверка интервала,
 * создание записи со статусом «Ожидает подтверждения» (FR-5.1–FR-5.3).
 * Ошибки API показываются человекочитаемым текстом (матрица ошибок ТЗ).
 */
export function BookingPage() {
  const { centerId } = useParams<{ centerId: string }>();
  const { donor } = useDonorProfile();
  const createAppointment = useCreateAppointment();

  // Центр берём из общего кэша центров (контракт ТЗ: GET /centers) — как в карточке центра
  const { centersQuery, center } = useCenter(centerId);

  return (
    <div>
      <PageGate
        queries={[centersQuery]}
        header={<PageHeader title="Запись на донацию" showBack />}
        skeleton={
          <Card>
            <Skeleton className="h-5 w-64" />
            <Skeleton className="mt-4 h-10 w-full" />
            <Skeleton className="mt-4 h-24 w-full" />
          </Card>
        }
        errorMessage="Не удалось загрузить данные центра."
      >
        {center ? (
          <>
            <PageHeader title="Запись на донацию" showBack />
            <BookingForm
              center={center}
              donor={donor}
              createAppointment={createAppointment}
            />
          </>
        ) : (
          <>
            <PageHeader title="Запись на донацию" showBack />
            <EmptyState
              icon="🏥"
              title="Центр не найден"
              description="Возможно, данные устарели. Вернитесь к карте и выберите центр заново."
              action={<LinkButton to="/map">Перейти к карте</LinkButton>}
            />
          </>
        )}
      </PageGate>
    </div>
  );
}

interface BookingFormProps {
  center: Center;
  /** null = гость — действия блокируются на уровне маршрута (FR-1.4) */
  donor: Donor | null;
  createAppointment: ReturnType<typeof useCreateAppointment>;
}

function BookingForm({ center, donor, createAppointment }: BookingFormProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<Appointment | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!donor) return;
    if (!date) {
      setFormError('Выберите дату донации');
      return;
    }
    if (!time) {
      setFormError('Выберите время');
      return;
    }
    if (!isDonationIntervalMet(donor.lastDonationAt, new Date(date))) {
      setFormError('Интервал не соблюдён — между донациями должно пройти не менее 60 дней');
      return;
    }

    createAppointment.mutate(
      { donorId: donor.id, centerId: center.id, date, time },
      {
        onSuccess: (appointment) => setCreated(appointment),
        onError: (error) =>
          setFormError(
            error instanceof Error
              ? error.message
              : 'Не удалось создать запись. Попробуйте ещё раз.',
          ),
      },
    );
  }

  if (created) {
    return (
      <Card>
        <p role="status" className="text-sm font-medium text-primary-700">
          Запись создана — ожидает подтверждения центра
        </p>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-600">Дата</dt>
            <dd className="font-medium text-ink-900">{formatDate(created.date)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-600">Время</dt>
            <dd className="font-medium text-ink-900">{created.time}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-600">Центр</dt>
            <dd className="font-medium text-ink-900">{center.name}</dd>
          </div>
        </dl>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-sm text-ink-600">{center.name}</p>
      <p className="mt-1 text-xs text-ink-600">{center.address}</p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Дата донации" htmlFor="booking-date">
          <Input
            id="booking-date"
            type="date"
            min={todayIsoDate()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium text-ink-900">Время</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                aria-pressed={time === slot}
                onClick={() => setTime(slot)}
                className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                  time === slot
                    ? 'border-primary-700 bg-primary-700 text-white'
                    : 'border-slate-300 bg-surface text-ink-600 hover:border-primary-700 hover:text-primary-700'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </fieldset>

        {formError && (
          <p role="alert" className="text-sm text-danger-600">
            {formError}
          </p>
        )}

        <Button type="submit" loading={createAppointment.isPending}>
          Записаться
        </Button>
      </form>

      <p className="mt-3 text-xs text-ink-600">Интервал между донациями — не менее 60 дней.</p>
    </Card>
  );
}
