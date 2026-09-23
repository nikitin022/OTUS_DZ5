import { Badge } from './Badge';
import type { Urgency } from '../../types';

const urgencyTone: Record<Urgency, 'neutral' | 'warning' | 'danger'> = {
  обычная: 'neutral',
  срочная: 'warning',
  критичная: 'danger',
};

/**
 * Метка срочности заявки (FR-3.1). Красный тон — только «критичная».
 */
export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <Badge tone={urgencyTone[urgency]}>{urgency}</Badge>;
}
