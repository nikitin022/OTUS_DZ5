interface ProgressBarProps {
  /** Собранный объём */
  value: number;
  /** Целевой объём */
  max: number;
  /** Доступное имя для скринридеров */
  label?: string;
}

/**
 * Полоса прогресса сбора крови по заявке (FR-3.1).
 */
export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-primary-600 transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
