import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Appointment } from '../types';
import { apiClient } from './client';
import type { RequestFilters } from './ApiClient';

/** Интервал автообновления ленты (FR-3.3: 30–60 секунд) */
export const FEED_REFETCH_INTERVAL_MS = 45_000;

/** Список центров (FR-2) */
export function useCenters() {
  return useQuery({
    queryKey: ['centers'],
    queryFn: () => apiClient.getCenters(),
  });
}

/** Заявки ленты с фильтрами и автообновлением (FR-3) */
export function useRequests(filters: RequestFilters = {}) {
  return useQuery({
    queryKey: ['requests', filters],
    queryFn: () => apiClient.getRequests(filters),
    refetchInterval: FEED_REFETCH_INTERVAL_MS,
  });
}

/** История донаций (FR-6) */
export function useDonationHistory(donorId: string | undefined) {
  return useQuery({
    queryKey: ['history', donorId],
    queryFn: () => apiClient.getDonationHistory(donorId as string),
    enabled: Boolean(donorId),
  });
}

/** Отклики на заявку (FR-8) */
export function useRequestResponses(requestId: string | undefined) {
  return useQuery({
    queryKey: ['responses', requestId],
    queryFn: () => apiClient.getRequestResponses(requestId as string),
    enabled: Boolean(requestId),
  });
}

/** Центр по идентификатору из кэша центров (селектор над useCenters) */
export function useCenter(centerId: string | undefined) {
  const centersQuery = useCenters();
  return {
    centersQuery,
    center: centersQuery.data?.find((c) => c.id === centerId),
  };
}

/** Создание записи на донацию (FR-5) */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Appointment, 'id' | 'status'>) => apiClient.createAppointment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
