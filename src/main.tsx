import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { DonorProfileProvider } from './features/profile/model/DonorProfileProvider';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Лента должна обновляться каждые 30-60 секунд (FR-3.3 / NFR-3)
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DonorProfileProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </DonorProfileProvider>
    </QueryClientProvider>
  </StrictMode>,
);
