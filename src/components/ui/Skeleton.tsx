interface SkeletonProps {
  className?: string;
}

/**
 * Скелетон загрузки (сценарий «Сеть» из матрицы ошибок ТЗ).
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}
