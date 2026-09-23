import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Некорректное значение: подсветка красным (матрица ошибок ТЗ) */
  invalid?: boolean;
}

/**
 * Текстовое поле ввода. Используется внутри `Field` с подписью и ошибкой.
 */
export function Input({ invalid = false, className = '', ...rest }: InputProps) {
  return (
    <input
      className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink-900 transition-colors placeholder:text-ink-600/60 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 ${
        invalid
          ? 'border-danger-600 focus:border-danger-600'
          : 'border-slate-300 focus:border-primary-700'
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
