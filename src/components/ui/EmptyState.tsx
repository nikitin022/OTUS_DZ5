import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Эмодзи-иконка (декоративная) */
  icon?: string;
  /** Действие: «Сбросить фильтры», «Изменить радиус» и т.п. (матрица ошибок ТЗ) */
  action?: ReactNode;
}

/**
 * Пустое состояние: иконка, пояснение и действие.
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <section className="rounded-card border border-dashed border-slate-300 bg-surface p-8 text-center">
      {icon && (
        <div aria-hidden className="text-3xl">
          {icon}
        </div>
      )}
      <h2 className="mt-2 text-base font-semibold text-ink-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </section>
  );
}
