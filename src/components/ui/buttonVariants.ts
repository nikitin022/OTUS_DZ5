/**
 * Общие стили вариантов для Button и LinkButton (единый UI-кит).
 * Минимальная высота 44px — удобная зона нажатия на мобильных.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800',
  secondary:
    'border border-primary-700 bg-transparent text-primary-700 hover:bg-primary-50',
  danger: 'bg-danger-600 text-white hover:bg-red-700',
};

export function buttonClasses(variant: ButtonVariant): string {
  return `inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${variantClasses[variant]}`;
}