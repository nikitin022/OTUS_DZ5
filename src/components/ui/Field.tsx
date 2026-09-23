import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  /** id связанного элемента управления */
  htmlFor?: string;
  /** Текст ошибки под полем (подсветка + текст — матрица ошибок ТЗ) */
  error?: string | null;
  /** Дополнительная подсказка под полем */
  hint?: string;
  children: ReactNode;
}

/**
 * Обёртка поля формы: подпись, элемент управления, текст ошибки.
 */
export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-900">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-600">{hint}</p>
      ) : null}
    </div>
  );
}
