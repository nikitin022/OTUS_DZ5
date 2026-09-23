# Капля — PWA для доноров крови

Прогрессивное веб-приложение, которое показывает центры крови на интерактивной карте, ведёт живую ленту потребностей и помогает донорам записываться, когда в их городе нужна именно их группа крови.

Проект развивается в двух частях:
- **Frontend** — React + TypeScript PWA (карта, лента, профиль, запись на донацию);
- **Backend** — управляемый PostgreSQL (Supabase): REST API, аутентификация по телефону с одноразовым кодом, Row Level Security, подписки на push-уведомления.

## Статус

- [x] Контракт API и модели данных (`src/api`, `src/types`)
- [x] Схема базы данных PostgreSQL ([docs/database_schema.md](docs/database_schema.md))
- [x] Выбор инфраструктуры — Supabase ([docs/infrastructure_decision.md](docs/infrastructure_decision.md))
- [x] Развёртывание базы данных (миграции, RLS) — проект Supabase, применены миграции 0001-0007
- [x] REST API endpoints ([docs/api_reference.md](docs/api_reference.md)) — PostgREST + RPC-функции
- [x] Аутентификация и Row Level Security ([docs/authentication.md](docs/authentication.md)) — телефон + OTP, RLS-политики, секреты
- [x] Интеграция фронтенда с бэкендом — `SupabaseApiClient` заменяет mock-слой
- [x] Обработка ошибок и логирование ([docs/logging.md](docs/logging.md)) — единый маппинг ошибок, логи Supabase

## Технологии

| Слой | Технология |
|---|---|
| База данных | PostgreSQL (Supabase) |
| API | Supabase REST (PostgREST) + RPC-функции |
| Аутентификация | Supabase Auth (телефон + OTP) |
| Миграции | SQL-миграции в `supabase/migrations` |
| Фронтенд | React 18 + TypeScript + Vite (PWA) |
| Стили | Tailwind CSS v4 (концепция Minimalist, mobile-first, WCAG AA) |
| Карта | Leaflet + react-leaflet (OpenStreetMap) |
| Серверное состояние | TanStack Query (автообновление ленты каждые 45 секунд) |
| Клиент бэкенда | `@supabase/supabase-js` |
| Тестирование | Vitest + React Testing Library |

Инфраструктурное решение (Supabase / BaaS против self-hosted PostgreSQL) зафиксировано и обосновано в [docs/infrastructure_decision.md](docs/infrastructure_decision.md).

## Интеграция с бэкендом

Доступ к данным изолирован за контрактом `ApiClient` (раздел 8 ТЗ). Реализация выбирается по переменным окружения:

- заданы `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY` → `SupabaseApiClient` (реальный бэкенд: REST/RPC, сессии Auth);
- не заданы (unit-тесты, локальная разработка без бэкенда) → `MockApiClient` (localStorage).

Контракт и UI-компоненты при этом не меняются. Маппинг snake_case ↔ camelCase и структур данных — в `src/api/supabase/mappers.ts`.

Бизнес-правила выполняются на стороне БД: запись на донацию — RPC `create_appointment` (интервал ≥ 60 дней, свободный слот, одна запись в день), профиль донора — RPC `register_donor_profile`, подписка на push — RPC `register_push_subscription`.

## Быстрый старт

Требуется Node.js 20+.

```bash
npm install
cp .env.example .env.local   # подставить URL и ключ проекта Supabase
npm run dev                  # дев-сервер Vite на http://localhost:5173
```

Без `.env.local` приложение работает на mock-слое (полностью функционально, данные в localStorage).

Прочие команды:

```bash
npm run test     # Vitest: unit-тесты (модели, маппинг, UI)
npm run lint     # ESLint (0 ошибок / 0 предупреждений)
npm run build    # прод-сборка + Service Worker + manifest (dist/)
npm run preview  # локальный просмотр прод-сборки
npm run deploy   # сборка для GitHub Pages (base=/OTUS_DZ5/) и публикация в gh-pages
```

## Переменные окружения

| Переменная | Назначение | Где взять |
|---|---|---|
| `VITE_SUPABASE_URL` | URL проекта Supabase | Панель проекта → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) ключ | Панель проекта → Settings → API |

Файл `.env.local` не коммитится; шаблон — [.env.example](.env.example). `service_role`-ключ во фронтенд-окружение не включается (см. [docs/authentication.md](docs/authentication.md), раздел «Секреты»). Подключение SMS-провайдера для OTP — операционная настройка в дашборде Supabase (Authentication → Providers → Phone).

## Структура репозитория

```
├── README.md                     # Описание проекта и запуск
├── technical_specification.md    # Техническое задание (модель данных, контракт API)
├── rules.md                      # Правила работы с кодовой базой
├── .env.example                  # Шаблон переменных окружения
├── src/
│   ├── types/                    # Модели данных (Донор, Центр, Заявка, ...)
│   ├── api/                      # Контракт ApiClient, хуки TanStack Query
│   │   ├── supabase/             # SupabaseApiClient, маппинг, Auth-хелперы
│   │   └── mock/                 # Mock-реализация (тесты, dev без бэкенда)
│   ├── app/                      # Роутинг, Layout (адаптивная навигация), 404
│   ├── components/               # UI-кит, RequireDonor (гостевой guard, FR-1.4)
│   ├── features/                 # map, feed, centers, booking, history, profile, geo
│   ├── lib/                      # Утилиты: гео, рабочие часы, форматы, валидации
│   └── test/                     # Настройка тестового окружения
├── docs/
│   ├── database_schema.md        # Схема БД: сущности, связи, индексы, RLS
│   ├── infrastructure_decision.md# Выбор инфраструктуры (Supabase) и обоснование
│   ├── api_reference.md          # Справочник API endpoints и примеров запросов
│   ├── authentication.md         # Аутентификация (телефон + OTP), роли, секреты, CORS
│   └── frontend/                 # Документация фронтенда (ТЗ-требования, отчёты)
├── public/                       # Иконки PWA, favicon
└── supabase/
    └── migrations/               # SQL-миграции 0001-0007
```

## Возможности приложения

- **Карта центров** — маркеры со статусом «открыто/закрыто», поиск по названию/адресу, фильтры «Открыто сейчас» / «Есть срочные», карточка центра, маршрут во внешних картах;
- **Живая лента потребностей** — заявки с группой крови, объёмом, срочностью и прогрессом; фильтры, пагинация, автообновление каждые 45 секунд;
- **Профиль донора** — группа крови, резус, радиус поиска 1–500 км, явные согласия на геолокацию и уведомления; вход по телефону с одноразовым кодом;
- **Запись на донацию** — дата и слоты времени, контроль интервала ≥ 60 дней на сервере, статус «Ожидает подтверждения»;
- **История донаций** — даты, места, объёмы, статусы и индикатор «Интервал соблюдён»;
- **PWA** — Service Worker, офлайн-кэш, установка на устройство;
- **Адаптивная вёрстка** от 320px (нижняя таб-навигация на мобильных, меню в шапке на десктопе).

## Деплой

Приложение хостится на GitHub Pages из ветки `gh-pages`:

```bash
npm run deploy   # build:pages + публикация dist в gh-pages
```

Обновление страницы после нового деплоя может занять 1–2 минуты.

## Документация

- `technical_specification.md` — требования, модель данных (раздел 7), контракт API (раздел 8)
- [docs/database_schema.md](docs/database_schema.md) — схема базы данных и модель доступа (RLS)
- [docs/infrastructure_decision.md](docs/infrastructure_decision.md) — выбор инфраструктурного решения (Supabase) и обоснование
- [docs/api_reference.md](docs/api_reference.md) — справочник API endpoints, примеры запросов, отчёт о тестировании
- [docs/authentication.md](docs/authentication.md) — аутентификация (телефон + OTP), роли, защита секретов, CORS
- [docs/logging.md](docs/logging.md) — логирование: источники логов Supabase, пример анализа, запросы для диагностики
- `docs/frontend/` — проектная документация фронтенда (функциональные требования, отчёты о тестировании и разработке)