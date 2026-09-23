import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/map', label: 'Карта' },
  { to: '/feed', label: 'Лента' },
  { to: '/history', label: 'История' },
  { to: '/profile', label: 'Профиль' },
];

/**
 * Базовый каркас приложения: шапка, контент экранов, нижняя навигация (mobile-first).
 */
export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-slate-200 bg-surface">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-primary-700">Капля</span>

          {/* Горизонтальная навигация — планшеты и десктоп (md+) */}
          <nav aria-label="Основная навигация" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-50 font-semibold text-primary-800'
                          : 'text-ink-600 hover:bg-slate-100 hover:text-primary-700'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6 md:pb-12">
        <Outlet />
      </main>

      {/* Нижняя таб-панель — мобильные (до md), с safe-area для iOS PWA */}
      <nav
        aria-label="Основная навигация"
        className="sticky bottom-0 border-t border-slate-200 bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto flex w-full max-w-3xl">
          {navItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-12 flex-col items-center justify-center py-2 text-xs transition-colors ${
                    isActive
                      ? 'font-semibold text-primary-700'
                      : 'text-ink-600 hover:text-primary-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
