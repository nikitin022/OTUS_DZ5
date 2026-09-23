import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClasses, type ButtonVariant } from './buttonVariants';

export type { ButtonVariant } from './buttonVariants';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** При загрузке кнопка блокируется и показывает статус */
  loading?: boolean;
  children: ReactNode;
}

/**
 * Базовая кнопка. Минимальная высота 44px — удобная зона нажатия на мобильных.
 */
export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${buttonClasses(variant)} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Загрузка…' : children}
    </button>
  );
}
