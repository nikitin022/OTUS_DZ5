import { useEffect, useState } from 'react';

export interface UserCoordsState {
  /** Координаты [широта, долгота] или null, если недоступны */
  coords: [number, number] | null;
  /** Причина недоступности геолокации (матрица ошибок ТЗ) */
  notice: string | null;
}

/**
 * Координаты пользователя через Geolocation API (однократный запрос).
 * При отказе или ошибке возвращает уведомление — интерфейс продолжает
 * работать с центром города по умолчанию.
 */
export function useUserCoords(): UserCoordsState {
  const [state, setState] = useState<UserCoordsState>({
    coords: null,
    notice: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!('geolocation' in navigator)) {
      setState({
        coords: null,
        notice: 'Геолокация недоступна — показываем весь город.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!cancelled) {
          setState({
            coords: [position.coords.latitude, position.coords.longitude],
            notice: null,
          });
        }
      },
      () => {
        if (!cancelled) {
          setState({
            coords: null,
            notice:
              'Не удалось определить местоположение — показываем весь город. Разрешите доступ к геолокации в настройках браузера.',
          });
        }
      },
      { timeout: 5000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
