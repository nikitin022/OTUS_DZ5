import { Button } from './Button';

interface ErrorBannerProps {
  /** Сообщение об ошибке (по умолчанию — сценарий «Нет соединения») */
  message?: string;
  /** Подпись кнопки повтора: «Повторить» или «Обновить сейчас» (матрица ошибок ТЗ) */
  retryLabel?: string;
  /** Действие повтора */
  onRetry?: () => void;
}

/**
 * Баннер ошибки сети: «Нет соединения» + «Повторить» (матрица ошибок ТЗ).
 * Жёлтый тон — ошибка не блокирующая, красный оставлен для «Срочно/Критично».
 */
export function ErrorBanner({
  message = 'Нет соединения. Проверьте интернет.',
  retryLabel = 'Повторить',
  onRetry,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-card border border-amber-300 bg-amber-50 p-4"
    >
      <p className="text-sm text-amber-800">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
