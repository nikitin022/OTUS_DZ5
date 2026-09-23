import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { LinkButton } from '../components/ui/LinkButton';

/** Экран 404: некорректный адрес. */
export function NotFoundPage() {
  return (
    <div>
      <PageHeader title="Страница не найдена" />
      <EmptyState
        icon="🔍"
        title="Такой страницы нет"
        description="Проверьте адрес или вернитесь на карту центров."
        action={<LinkButton to="/map">На карту</LinkButton>}
      />
    </div>
  );
}
