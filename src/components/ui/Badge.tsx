import type { ReactNode } from 'react';

type BadgeTone = 'neutral' | 'warning' | 'danger' | 'success';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-ink-600',
  warning: 'bg-amber-100 text-amber-800',
  // Красный — только для блокирующих ошибок и статусов «Срочно/Критично»
  danger: 'bg-red-100 text-red-700',
  success: 'bg-primary-100 text-primary-800',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

/**
 * Небольшая метка-статус (срочность заявки, статус центра и т.п.).
 */
export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
