import { Suspense, lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { NotFoundPage } from './NotFoundPage';
import { RequireDonor } from '../components/routing/RequireDonor';
import { Skeleton } from '../components/ui/Skeleton';
import { CenterPage } from '../features/centers/ui/CenterPage';
import { FeedPage } from '../features/feed/ui/FeedPage';
import { RequestPage } from '../features/feed/ui/RequestPage';
import { BookingPage } from '../features/booking/ui/BookingPage';
import { HistoryPage } from '../features/history/ui/HistoryPage';
import { ProfilePage } from '../features/profile/ui/ProfilePage';

/**
 * Карта — самый тяжёлый экран (Leaflet + тайлы), вынесен в отдельный чанк
 * и загружается лениво, чтобы не увеличивать главный бандл (NFR-1).
 */
const MapPage = lazy(() =>
  import('../features/map/ui/MapPage').then((module) => ({
    default: module.MapPage,
  })),
);

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Navigate to="/map" replace /> },
        // FR-2: карта центров (ленивый чанк с Leaflet)
        {
          path: 'map',
          element: (
            <Suspense
              fallback={<Skeleton className="h-80 w-full md:h-[420px]" />}
            >
              <MapPage />
            </Suspense>
          ),
        },
        { path: 'centers/:centerId', element: <CenterPage /> },
        // FR-5: запись на донацию — только для авторизованных (FR-1.4)
        {
          path: 'centers/:centerId/book',
          element: (
            <RequireDonor>
              <BookingPage />
            </RequireDonor>
          ),
        },
        // FR-3: живая лента потребностей
        { path: 'feed', element: <FeedPage /> },
        // FR-4.3: карточка заявки — цель диплинка из push
        { path: 'requests/:requestId', element: <RequestPage /> },
        // FR-6: история донаций
        { path: 'history', element: <HistoryPage /> },
        // FR-1: профиль донора
        { path: 'profile', element: <ProfilePage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  {
    // Заблаговременно включаем поведение React Router v7 (без предупреждений в консоли)
    future: {
      v7_relativeSplatPath: true,
    },
    // Базовый путь для хостинга в подкаталоге (GitHub Pages: /OTUS_DZ4/);
    // в dev и при корневом деплое BASE_URL === '/'
    basename: import.meta.env.BASE_URL,
  },
);
