import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  /** Показывать кнопку «Назад» (на вложенных экранах) */
  showBack?: boolean;
}

/**
 * Заголовок экрана с опциональной кнопкой «Назад».
 */
export function PageHeader({ title, showBack = false }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-4 flex items-center gap-3">
      {showBack && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Назад"
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-ink-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
        >
          <span aria-hidden>←</span>
        </button>
      )}
      <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
    </div>
  );
}
