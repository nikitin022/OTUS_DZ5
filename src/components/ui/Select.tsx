import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Некорректное значение: подсветка красным (матрица ошибок ТЗ) */
  invalid?: boolean;
}

/**
 * Выпадающий список. Используется внутри `Field` с подписью и ошибкой.
 */
export function Select({ invalid = false, className = '', children, ...rest }: SelectProps) {
  return (
    <select
      className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink-900 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-ink-600 ${
        invalid
          ? 'border-danger-600 focus:border-danger-600'
          : 'border-slate-300 focus:border-primary-700'
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
