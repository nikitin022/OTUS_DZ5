import { ApiError, type ApiClient } from './ApiClient';

/**
 * Единый маппинг технических ошибок API в человекочитаемые сообщения
 * (матрица ошибок ТЗ, раздел 6). Русские сообщения бизнес-правил из
 * RPC-функций (миграции 0005, 0007) передаются напрямую.
 */

/** Сообщение для сетевых сбоев (нет соединения, таймаут) */
export const NETWORK_ERROR_MESSAGE =
  'Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз.';

/** Коды PostgREST/Postgres -> UX-сообщение */
const MESSAGES_BY_CODE: Record<string, string> = {
  // Сессия/аутентификация
  PGRST301: 'Сессия истекла. Войдите заново, чтобы продолжить.',
  '28P01': 'Сессия истекла. Войдите заново, чтобы продолжить.',
  // Доступ (Row Level Security)
  '42501': 'Недостаточно прав для этого действия.',
  // Целостность данных
  '23505': 'Такая запись уже существует.',
  '23503': 'Связанные данные не найдены или устарели. Обновите страницу.',
  '23514': 'Данные не соответствуют ограничениям.',
  // Некорректные параметры
  '22P02': 'Некорректное значение параметра запроса.',
  PGRST102: 'Некорректный формат запроса.',
  PGRST116: 'Запись не найдена или данные изменились.',
  // Сервер
  '54000': 'Сервер перегружен. Попробуйте позже.',
  '58000': 'Внутренняя ошибка сервера. Попробуйте позже.',
  XX000: 'Внутренняя ошибка сервера. Попробуйте позже.',
};

/** PostgrestError -> ApiError с человекочитаемым сообщением */
export function toApiError(error: { message: string; code?: string }): ApiError {
  const mapped = error.code ? MESSAGES_BY_CODE[error.code] : undefined;
  return new ApiError(mapped ?? error.message, error.code ?? 'API_ERROR');
}

function rethrowNetworkError(error: unknown): never {
  // Сетевые сбои fetch приходят как TypeError; остальные ошибки проходят как есть
  if (error instanceof TypeError) {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 'NETWORK_ERROR');
  }
  throw error;
}

/**
 * Обёртка клиента API: сетевой сбой (TypeError из fetch) преобразуется в ApiError
 * с понятным сообщением, чтобы UI показывал его по матрице ошибок, а не технический текст.
 */
export function withNetworkErrorGuard(client: ApiClient): ApiClient {
  return {
    getCenters: () => client.getCenters().catch(rethrowNetworkError),
    getRequests: (filters) => client.getRequests(filters).catch(rethrowNetworkError),
    createRequest: (request) => client.createRequest(request).catch(rethrowNetworkError),
    updateRequest: (id, patch) => client.updateRequest(id, patch).catch(rethrowNetworkError),
    createAppointment: (appointment) =>
      client.createAppointment(appointment).catch(rethrowNetworkError),
    updateAppointment: (id, patch) =>
      client.updateAppointment(id, patch).catch(rethrowNetworkError),
    subscribeToPush: (subscription) =>
      client.subscribeToPush(subscription).catch(rethrowNetworkError),
    getDonationHistory: (donorId) => client.getDonationHistory(donorId).catch(rethrowNetworkError),
    getRequestResponses: (requestId) =>
      client.getRequestResponses(requestId).catch(rethrowNetworkError),
  };
}