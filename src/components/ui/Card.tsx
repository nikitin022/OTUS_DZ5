import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Базовый контейнер-карточка (Minimalist: скругление, тонкая граница, белая поверхность).
 */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-card border border-slate-200 bg-surface p-4 ${className}`}>
      {children}
    </div>
  );
}
