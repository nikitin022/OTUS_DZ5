# Backend documentation — «Капля»

Сводная документация серверной части PWA «Капля»: архитектура, развёртывание, API, процесс разработки.

## 1. Архитектура решения

```
┌─────────────────────────────┐         HTTPS + publishable key         ┌──────────────────────────────────┐
│  PWA «Капля» (фронтенд)     │  ─────────────────────────────────────► │  Supabase (BaaS)                 │
│  GitHub Pages               │         REST (PostgREST)                │                                  │
│                             │         RPC: create_appointment,        │  ┌────────────────────────────┐  │
│  React 18 + TypeScript      │         register_donor_profile,         │  │ PostgreSQL 17              │  │
│  Vite, Tailwind, Leaflet    │         register_push_subscription      │  │ 8 таблиц public + private  │  │
│  TanStack Query (лента)     │  ─────────────────────────────────────► │  │ RLS-политики (миграции     │  │
│  PWA: Service Worker        │         Auth: /auth/v1/*                │  │ 0002, 0003, 0007)          │  │
│                             │         (телефон + OTP, JWT-сессии)     │  └────────────────────────────┘  │
└─────────────────────────────┘                                         └──────────────────────────────────┘
```

### 1.1. Слои и ответственность

| Слой | Расположение | Ответственность |
|---|---|---|
| UI (features) | `src/features/*` | Экраны: карта, лента, профиль, запись, история. Не знает о деталях транспорта |
| Контракт API | `src/api/ApiClient.ts` | Интерфейс 9 операций (ТЗ, раздел 8) + `ApiError` |
| Реализации | `src/api/supabase/`, `src/api/mock/` | `SupabaseApiClient` (REST/RPC/Auth) и mock на localStorage; выбор по env (`client.ts`) |
| Маппинг | `src/api/supabase/mappers.ts` | snake_case ↔ camelCase, `coordinates`, `workingHours`, `consents`, join-поля |
| Ошибки | `src/api/errorMessages.ts` | Единый маппинг кодов → UX-сообщения, сетевой guard |
| База данных | `supabase/migrations/*` | Схема, ENUM-типы, RLS, бизнес-правила, индексы, триггеры |
| Логи | Supabase Logs | edge/PostgREST/Postgres/Auth/pgbouncer (docs/logging.md) |

### 1.2. Модель данных и доступа

- 8 таблиц: `donors`, `centers`, `blood_requests`, `appointments`, `request_responses`, `notifications`, `donation_history`, `notification_settings` (+ `push_subscriptions`, схема `private` для helper-функций);
- связи и поля — `docs/database_schema.md` (ER-диаграмма, соответствие TS-моделям);
- роли: **гость** (чтение ленты/центров/откликов), **донор** (свои записи/отклики/подписки), **координатор** (`donors.role = 'coordinator'`, управление центрами и заявками), **системный контур** (`service_role`: уведомления, история);
- контроль доступа — RLS на уровне БД: клиент не может обойти политики даже с publishable-ключом;
- бизнес-правила выполняются в БД: интервал донаций ≥ 60 дней, свободный слот, одна запись в день (RPC `create_appointment`), идемпотентный профиль (RPC `register_donor_profile`).

### 1.3. Миграции

| Файл | Содержимое |
|---|---|
| `0001_initial_schema.sql` | ENUM-типы, 8 таблиц, связи, индексы, триггер `updated_at` |
| `0002_rls_policies.sql` | Включение RLS, политики ролей, запрет смены `donors.role` клиентом |
| `0003_rls_hardening.sql` | Схема `private`, фиксация `search_path`, разделение `FOR ALL`, `(select auth.uid())`, индекс FK |
| `0004_reference_data.sql` | Справочник центров (8), демо-заявки ленты |
| `0005_api_functions.sql` + `0006_api_functions_fix.sql` | RPC `create_appointment`, `register_donor_profile` (исправление `RETURNING INTO`) |
| `0007_push_subscriptions.sql` | Таблица подписок push + RPC `register_push_subscription` |

## 2. Инструкции по развёртыванию

### 2.1. База данных (Supabase)

1. Создать проект Supabase (регион ближе к пользователям, например eu-central-1);
2. Применить миграции из `supabase/migrations/` по порядку: SQL Editor (по одному файлу) или CLI:
   ```bash
   supabase db push
   ```
3. Authentication → Providers → Phone: подключить SMS-провайдера (Twilio/Vonage/MessageBird), ключи — в секреты дашборда. Для разработки можно включить фиксированный тестовый код;
4. Authentication → URL Configuration: Site URL и Redirect URLs — домен фронтенда (`https://nikitin022.github.io/OTUS_DZ5/`);
5. Проверка: Logs → PostgREST (схема загружена), GET `/rest/v1/centers` с publishable-ключом → 200.

### 2.2. Фронтенд (GitHub Pages)

1. Скопировать `.env.example` → `.env.local`, подставить `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY` (Settings → API проекта);
2. `npm install` → `npm run build` (или `npm run deploy` — сборка с `base=/OTUS_DZ5/` и публикация в ветку `gh-pages`);
3. GitHub: Settings → Pages → ветка `gh-pages`.

Без `.env.local` приложение работает на mock-слое — полностью функционально, данные в localStorage.

### 2.3. Секреты

| Секрет | Хранение |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.local` (не коммитится; шаблон `.env.example`) |
| `service_role`, пароль БД, ключи SMS | Только дашборд Supabase; во фронтенд-окружение не включаются |

<!-- PART2 -->
## 3. API endpoints

REST API генерируется PostgREST из схемы; кастомные операции — RPC. Полный справочник с параметрами и ответами: `docs/api_reference.md`. Аутентификация: `docs/authentication.md`.

| Операция | Метод и endpoint | Роль |
|---|---|---|
| Список центров | `GET /rest/v1/centers` | гость+ |
| Лента заявок (фильтры, пагинация) | `GET /rest/v1/blood_requests` | гость+ |
| Публикация заявки | `POST /rest/v1/blood_requests` | координатор |
| Правка/закрытие заявки | `PATCH /rest/v1/blood_requests?id=eq.<id>` | координатор |
| Запись на донацию (бизнес-правила) | `POST /rest/v1/rpc/create_appointment` | донор |
| Отмена/перенос записи | `PATCH /rest/v1/appointments?id=eq.<id>` | донор (владелец) |
| Профиль донора после входа | `POST /rest/v1/rpc/register_donor_profile` | авторизованный |
| Подписка на push | `POST /rest/v1/rpc/register_push_subscription` | донор |
| История донаций | `GET /rest/v1/donation_history?donor_id=eq.<id>` | донор (владелец) |
| Отклики на заявку | `GET /rest/v1/request_responses?request_id=eq.<id>` | гость+ |
| Вход: запрос OTP / проверка кода | `POST /auth/v1/otp`, `POST /auth/v1/verify` | любой |

Заголовки: `apikey: <publishable-key>` — всегда; `Authorization: Bearer <JWT>` — для операций авторизованного пользователя.

## 4. Примеры запросов

### 4.1. Лента активных заявок с центрами (гость)

```bash
curl "https://<project-ref>.supabase.co/rest/v1/blood_requests?status=eq.active&select=blood_group,rh_factor,volume_ml,urgency,collected_ml,centers(name)&order=updated_at.desc&limit=10" \\
  -H "apikey: <publishable-key>"
```

### 4.2. Запись на донацию (донор; интервал и слот проверяет RPC)

```bash
curl -X POST "https://<project-ref>.supabase.co/rest/v1/rpc/create_appointment" \\
  -H "apikey: <publishable-key>" -H "Authorization: Bearer <JWT>" \\
  -H "Content-Type: application/json" \\
  -d '{"p_center_id":"<uuid>","p_date":"2026-11-01","p_time":"10:00"}'
```

Ошибки возвращаются человекочитаемо: `{"code":"P0001","message":"Слот занят: выберите другое время"}`.

### 4.3. Вход по телефону

```bash
curl -X POST "https://<project-ref>.supabase.co/auth/v1/otp" \\
  -H "apikey: <publishable-key>" -H "Content-Type: application/json" \\
  -d '{"phone":"+79001234567"}'

curl -X POST "https://<project-ref>.supabase.co/auth/v1/verify" \\
  -H "apikey: <publishable-key>" -H "Content-Type: application/json" \\
  -d '{"type":"sms","phone":"+79001234567","token":"123456"}'
```

## 5. Тестирование

Матрица покрытия, e2e-проверки и перечень найденных/исправленных проблем — `docs/testing_report.md`.
Кратко: 103 unit-теста (Vitest), HTTP-проверки endpoints, RPC-тесты бизнес-правил под JWT, e2e-осмотр задеплоенного приложения, анализ логов Supabase.

## 6. Процесс разработки с AI

Разработка велась итеративно с AI-агентом (правила работы — `rules.md`); каждый шаг завершался коммитом.

| Этап | Роль AI |
|---|---|
| Проектирование БД | Генерация SQL-схемы по требованиям ТЗ и моделям фронтенда; ревизия ограничений, индексов, соответствия union-типам TS |
| API и бизнес-логика | Генерация RPC-функций и клиентского `SupabaseApiClient` за существующим контрактом; тесты маппинга |
| Безопасность | Разработка RLS-политик по ролям, разбор замечаний security/performance-линтеров Supabase до нуля |
| Интеграция | Адаптация провайдера профиля под OTP-поток без правок UI-компонентов |
| Отладка | Диагностика по логам (`docs/logging.md`, раздел 3: классификация 400/401/403 по edge_logs), разбор падений тестов (утечка env в Vitest), исправление SQL-бага `RETURNING INTO`, найденного RPC-тестом |
| Тестирование | Полный цикл из `docs/testing_report.md`; промпт-шаблоны отладки — `docs/frontend/ai_debugging_prompts.md` |

## 7. Связанные документы

- `technical_specification.md` — исходные требования (модель данных, контракт API);
- `docs/database_schema.md` — схема БД и модель доступа (RLS);
- `docs/infrastructure_decision.md` — обоснование выбора Supabase;
- `docs/api_reference.md` — справочник endpoints и отчёт HTTP-тестирования;
- `docs/authentication.md` — вход по телефону, роли, секреты, CORS;
- `docs/logging.md` — логи Supabase и анализ;
- `docs/testing_report.md` — отчёт о тестировании;
- `README.md` — запуск и структура репозитория.