import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useDonorProfile } from '../model/profileContext';
import { BLOOD_GROUP_OPTIONS, BLOOD_GROUP_LABELS, RH_OPTIONS } from '../../../lib/bloodGroups';
import { validateRadiusKm } from '../../../lib/validation';
import type { BloodGroup, Donor, RhFactor } from '../../../types';

interface FormState {
  phone: string;
  bloodGroup: BloodGroup;
  rhFactor: RhFactor;
  searchRadiusKm: string;
  consentGeo: boolean;
  consentPush: boolean;
}

interface FormErrors {
  phone?: string;
  bloodGroup?: string;
  searchRadiusKm?: string;
  consents?: string;
}

/**
 * Профиль донора (FR-1): группа крови, резус, радиус 1–500 км,
 * явные согласия на геолокацию и push (FR-1.2).
 *
 * Backend-режим: без сессии первый вход — телефон + одноразовый код (OTP);
 * после подтверждения профиль сохраняется на сервере (RPC register_donor_profile).
 * Mock-режим (тесты, dev без бэкенда): профиль в localStorage, OTP-шаг не активен.
 */
export function ProfilePage() {
  const { donor, saveDonor, confirmOtp, pendingOtpPhone } = useDonorProfile();
  const location = useLocation();
  const navigate = useNavigate();
  // Маршрут, с которого гость был перенаправлен на профиль (FR-1.4)
  const from = (location.state as { from?: string } | null)?.from;

  const [form, setForm] = useState<FormState>({
    phone: donor?.phone ?? '',
    bloodGroup: donor?.bloodGroup ?? '1',
    rhFactor: donor?.rhFactor ?? '+',
    searchRadiusKm: donor ? String(donor.searchRadiusKm) : '50',
    consentGeo: donor?.consents.geolocation ?? false,
    consentPush: donor?.consents.push ?? false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSuccess() {
    // Возврат к намерению после входа (FR-1.4)
    if (from) {
      navigate(from, { replace: true });
    } else {
      setSaved(true);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!form.phone.trim()) {
      nextErrors.phone = 'Укажите номер телефона';
    }
    if (!form.bloodGroup) {
      nextErrors.bloodGroup = 'Укажите группу крови';
    }
    const radiusError = validateRadiusKm(Number(form.searchRadiusKm));
    if (radiusError) {
      nextErrors.searchRadiusKm = radiusError;
    }
    if (!form.consentGeo || !form.consentPush) {
      nextErrors.consents = 'Нужно явное согласие на геолокацию и уведомления';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const nextDonor: Donor = {
      id: donor?.id ?? crypto.randomUUID(),
      phone: form.phone.trim(),
      bloodGroup: form.bloodGroup,
      rhFactor: form.rhFactor,
      searchRadiusKm: Number(form.searchRadiusKm),
      consents: {
        geolocation: form.consentGeo,
        push: form.consentPush,
      },
      lastDonationAt: donor?.lastDonationAt ?? null,
    };

    setSubmitting(true);
    try {
      // false — OTP-код отправлен, ожидается подтверждение (backend-режим)
      const ok = await saveDonor(nextDonor);
      if (ok) {
        handleSuccess();
      }
    } catch (error) {
      // Ошибки бэкенда (SMS-провайдер, формат телефона) — человекочитаемый текст
      setOtpError(undefined);
      setErrors((prev) => ({
        ...prev,
        phone: error instanceof Error ? error.message : 'Не удалось сохранить профиль',
      }));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(event: FormEvent) {
    event.preventDefault();
    if (!otpCode.trim()) {
      setOtpError('Введите код из SMS');
      return;
    }
    setSubmitting(true);
    try {
      const ok = await confirmOtp(otpCode.trim());
      if (ok) {
        handleSuccess();
      }
    } catch (error) {
      setOtpError(
        error instanceof Error ? error.message : 'Не удалось подтвердить код',
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div>
      <PageHeader title="Профиль донора" />
      <Card>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="Номер телефона" htmlFor="profile-phone" error={errors.phone}>
            <Input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              placeholder="+7 900 000-00-00"
              value={form.phone}
              invalid={Boolean(errors.phone)}
              onChange={(event) => update('phone', event.target.value)}
            />
          </Field>

          <Field label="Группа крови" htmlFor="profile-blood-group" error={errors.bloodGroup}>
            <Select
              id="profile-blood-group"
              value={form.bloodGroup}
              invalid={Boolean(errors.bloodGroup)}
              onChange={(event) => update('bloodGroup', event.target.value as BloodGroup)}
            >
              {BLOOD_GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Резус-фактор" htmlFor="profile-rh">
            <Select
              id="profile-rh"
              value={form.rhFactor}
              onChange={(event) => update('rhFactor', event.target.value as RhFactor)}
            >
              {RH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Радиус поиска, км"
            htmlFor="profile-radius"
            error={errors.searchRadiusKm}
            hint="От 1 до 500 км"
          >
            <Input
              id="profile-radius"
              type="number"
              min={1}
              max={500}
              value={form.searchRadiusKm}
              invalid={Boolean(errors.searchRadiusKm)}
              onChange={(event) => update('searchRadiusKm', event.target.value)}
            />
          </Field>

          <fieldset>
            <legend className="text-sm font-medium text-ink-900">Согласия</legend>
            <div className="mt-2 space-y-2">
              <label
                className="flex items-center gap-2 text-sm text-ink-600"
                htmlFor="profile-consent-geo"
              >
                <input
                  id="profile-consent-geo"
                  name="consentGeo"
                  type="checkbox"
                  className="h-4 w-4 accent-primary-700"
                  checked={form.consentGeo}
                  onChange={(event) => update('consentGeo', event.target.checked)}
                />
                Разрешаю использовать геолокацию
              </label>
              <label
                className="flex items-center gap-2 text-sm text-ink-600"
                htmlFor="profile-consent-push"
              >
                <input
                  id="profile-consent-push"
                  name="consentPush"
                  type="checkbox"
                  className="h-4 w-4 accent-primary-700"
                  checked={form.consentPush}
                  onChange={(event) => update('consentPush', event.target.checked)}
                />
                Разрешаю push-уведомления
              </label>
            </div>
            {errors.consents && (
              <p role="alert" className="mt-1 text-xs text-danger-600">
                {errors.consents}
              </p>
            )}
          </fieldset>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Сохраняем…' : 'Сохранить профиль'}
          </Button>

          {saved && donor && (
            <p role="status" className="text-sm text-primary-700">
              Профиль сохранён: {BLOOD_GROUP_LABELS[donor.bloodGroup]}, {donor.searchRadiusKm} км
            </p>
          )}
        </form>

        {pendingOtpPhone && (
          <form className="mt-6 space-y-4 border-t border-ink-200 pt-6" onSubmit={handleOtpSubmit} noValidate>
            <p role="status" className="text-sm text-ink-600">
              Код подтверждения отправлен на номер {pendingOtpPhone}. Введите его, чтобы
              завершить вход и сохранить профиль.
            </p>
            <Field label="Код из SMS" htmlFor="profile-otp" error={otpError}>
              <Input
                id="profile-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={otpCode}
                invalid={Boolean(otpError)}
                onChange={(event) => setOtpCode(event.target.value)}
              />
            </Field>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Проверяем…' : 'Подтвердить код'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}