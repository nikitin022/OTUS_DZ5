import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { buttonClasses, type ButtonVariant } from './buttonVariants';

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Внутренний маршрут — рендерится react-router <Link> (SPA-переход) */
  to?: string;
  /** Внешний адрес — рендерится обычный <a> */
  href?: string;
  variant?: ButtonVariant;
  children: ReactNode;
}

/**
 * Ссылка в стиле кнопки — для действий-переходов (EmptyState, карточки).
 * Заменяет дублированные строки классов на `<Link className="inline-flex…">`.
 */
export function LinkButton({
  to,
  href,
  variant = 'primary',
  className = '',
  children,
  ...rest
}: LinkButtonProps) {
  const classes = `${buttonClasses(variant)} ${className}`;

  if (to) {
    return (
      <RouterLink to={to} className={classes} {...rest}>
        {children}
      </RouterLink>
    );
  }

  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  );
}