import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '../ui/Skeleton';
import { useDonorProfile } from '../../features/profile/model/profileContext';

/**
 * Защита действий, требующих входа (FR-1.4): гость перенаправляется
 * на профиль, исходный маршрут сохраняется для возврата после входа.
 * Во время восстановления сессии (backend-режим) показывается скелетон.
 */
export function RequireDonor({ children }: { children: ReactNode }) {
  const { donor, initializing } = useDonorProfile();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-40 w-full" />
      </div>
    );
  }

  if (!donor) {
    return <Navigate to="/profile" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}