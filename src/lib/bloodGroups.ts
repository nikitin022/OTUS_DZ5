import type { BloodGroup, RhFactor, Urgency } from '../types';

/** Подписи групп крови (российское обозначение) */
export const BLOOD_GROUP_LABELS: Record<BloodGroup, string> = {
  '1': 'I (0)',
  '2': 'II (A)',
  '3': 'III (B)',
  '4': 'IV (AB)',
};

/** Варианты для выпадающих списков */
export const BLOOD_GROUP_OPTIONS: { value: BloodGroup; label: string }[] = (
  Object.keys(BLOOD_GROUP_LABELS) as BloodGroup[]
).map((value) => ({ value, label: BLOOD_GROUP_LABELS[value] }));

export const RH_OPTIONS: { value: RhFactor; label: string }[] = [
  { value: '+', label: 'Rh+' },
  { value: '-', label: 'Rh−' },
];

export const URGENCY_OPTIONS: { value: Urgency; label: string }[] = [
  { value: 'обычная', label: 'Обычная' },
  { value: 'срочная', label: 'Срочная' },
  { value: 'критичная', label: 'Критичная' },
];

/** Полная подпись: «II (A) Rh+» */
export function formatBloodGroup(group: BloodGroup, rh: RhFactor): string {
  const rhLabel = rh === '+' ? 'Rh+' : 'Rh−';
  return `${BLOOD_GROUP_LABELS[group]} ${rhLabel}`;
}
