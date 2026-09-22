# Аутентификация «Капля»

Аутентификация реализована на Supabase Auth: вход по номеру телефона с одноразовым кодом (SMS OTP), сессии на JWT (access + refresh токены). Соответствует требованиям ТЗ (раздел 10: вход по телефону с одноразовым кодом; полная верификация через SMS-провайдера — операционная настройка).

## 1. Поток входа

```
┌──────────┐    POST /auth/v1/otp        ┌───────────────┐    SMS     ┌─────────┐
│ Фронтенд │ ──────────────────────────► │ Supabase Auth │ ─────────► │ Донор   │
│          │    { phone }                │               │            │         │
│          │ ◄────────────────────────── │               │            │         │
│          │    200 (код отправлен)      │               │            │         │
│          │                             │               │            │         │
│          │    POST /auth/v1/verify     │               │            │         │
│          │ ──────────────────────────► │               │            │         │
│          │    { phone, token }         │               │            │         │
│          │ ◄────────────────────────── │               │            │         │
│          │  200 { access_token,        │               │            │         │
│          │         refresh_token,      │               │            │         │
│          │         user }              │               │            │         │
└──────────┘                             └───────────────┘            └─────────┘
```

### 1.1. Запрос кода

```bash
curl -X POST "https://<project-ref>.supabase.co/auth/v1/otp" \\
  -H "apikey: <publishable-key>" -H "Content-Type: application/json" \\
  -d '{"phone":"+79001234567"}'
```

Успех — `200 OK` (код отправлен по SMS). Формат телефона — E.164.

### 1.2. Проверка кода и выдача сессии

```bash
curl -X POST "https://<project-ref>.supabase.co/auth/v1/verify" \\
  -H "apikey: <publishable-key>" -H "Content-Type: application/json" \\
  -d '{"type":"sms","phone":"+79001234567","token":"123456"}'
```

Успех — `200 OK`:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "expires_in": 3600,
  "user": { "id": "<uuid>", "phone": "+79001234567", "role": "authenticated" }
}
```

`access_token` (JWT) используется в заголовке `Authorization: Bearer` для всех операций авторизованного пользователя (см. `docs/api_reference.md`). JWT содержит claim `sub` = id пользователя; профиль донора связывается по `donors.auth_user_id`.

### 1.3. Обновление сессии

```bash
curl -X POST "https://<project-ref>.supabase.co/auth/v1/token?grant_type=refresh_token" \\
  -H "apikey: <publishable-key>" -H "Content-Type: application/json" \\
  -d '{"refresh_token":"<refresh-token>"}'
```

## 2. Создание профиля донора после входа

Учётная запись создаётся автоматически при первой проверке кода, но профиль донора (группа крови, резус, радиус, согласия) — нет. После первого входа фронтенд вызывает RPC-функцию (FR-1, FR-1.2):

```bash
curl -X POST "https://<project-ref>.supabase.co/rest/v1/rpc/register_donor_profile" \\
  -H "apikey: <publishable-key>" -H "Authorization: Bearer <JWT>" \\
  -H "Content-Type: application/json" \\
  -d '{"p_phone":"+79001234567","p_blood_group":"2","p_rh_factor":"-","p_search_radius_km":100,"p_consent_geolocation":true,"p_consent_push":true}'
```

Функция идемпотентна: при повторном вызове обновляет профиль; настройки уведомлений создаются автоматически (1:1). Связь с учётной записью — `donors.auth_user_id = auth.uid()`; изменить `role` через клиентский API невозможно (column-level GRANT, миграция 0002).

## 3. Фактическое состояние и тестирование

| # | Запрос | Ответ | Вывод |
|---|---|---|---|
| 1 | `POST /auth/v1/otp` (валидный телефон) | 400 `phone_provider_disabled` — Unsupported phone provider | Эндпоинт доступен, требуется подключение SMS-провайдера |
| 2 | `POST /auth/v1/verify` (любой код) | 403 `otp_expired` — Token has expired or is invalid | Проверка кода работает, код не выдан — корректный отказ |

Подключение SMS-провайдера (Twilio, Vonage, MessageBird) — операционная настройка в дашборде Supabase (Authentication → Providers → Phone): ключи провайдера вносятся в секреты дашборда и не хранятся в репозитории. Для разработки без SMS можно временно включить провайдер с фиксированным тестовым кодом (dev-режим).

<!-- PART2 -->
## 4. Безопасность OTP

| Механизм | Описание |
|---|---|
| Одноразовый код | 6 цифр, срок жизни настраивается в дашборде (по умолчанию 60 секунд) |
| Rate limits | Supabase Auth ограничивает частоту запросов OTP и verify (защита от подбора и спама SMS) |
| E.164 | Телефон валидируется по формату `+<код страны><номер>` |
| Refresh rotation | `refresh_token` одноразовый: при обновлении выдаётся новый |

## 5. Роли и права

Роли системы (ТЗ раздел 3) и их связь с аутентификацией:

| Роль | Кто | Как определяется |
|---|---|---|
| Гость | Не авторизован | JWT нет; запросы только с `apikey` — RLS-политики `anon` (чтение центров, ленты, откликов) |
| Донор | Авторизованный пользователь | JWT; профиль в `donors` с `auth_user_id = auth.uid()`, `role = 'donor'` |
| Координатор | Авторизованный пользователь | JWT; `donors.role = 'coordinator'`; роль назначается только в БД (напрямую или через service_role) — клиентский API изменить её не может |

Модель доступа реализована политиками RLS (миграции 0002–0003, описание в `docs/database_schema.md`, раздел 10):

- гость: чтение центров, заявок (ленты), откликов; приватные данные скрыты (проверено: `GET /appointments` → `[]`);
- донор: только свои записи/отклики/уведомления/история/настройки (через `private.auth_donor_id()`);
- координатор: управление центрами и заявками (через `private.is_coordinator()`);
- запись уведомлений и истории донаций — только системный контур (`service_role`), клиентских INSERT-политик нет.

## 6. Секреты

| Секрет | Где хранится | Может быть публичным |
|---|---|---|
| URL проекта (`https://<ref>.supabase.co`) | `.env` фронтенда (`VITE_SUPABASE_URL`) | Да (это публичный адрес API) |
| Publishable/anon-ключ | `.env` фронтенда (`VITE_SUPABASE_PUBLISHABLE_KEY`) | Да — ключ рассчитан на клиент; безопасность данных обеспечивают RLS-политики |
| `service_role`-ключ | Только дашборд Supabase / секреты Edge Functions | **Нет** — обход RLS; во фронтенд-окружение не включается |
| Ключи SMS-провайдера | Дашборд Supabase (Authentication → Providers) | Нет |
| Пароль БД (postgres) | Дашборд Supabase, ротация при компрометации | Нет |

Правила:

1. `.env` в `.gitignore` — реальные значения не коммитятся; в репозитории только `.env.example` с плейсхолдерами;
2. ключи в документации маскируются (`<publishable-key>`, `<project-ref>`);
3. при утечке `service_role`-ключа или пароля БД — немедленная ротация в дашборде;
4. publishable-ключ без JWT не даёт доступа к приватным данным — строки скрывает RLS (проверено тестами Шага 4).

## 7. CORS

Фронтенд (PWA на GitHub Pages) обращается к Supabase напрямую из браузера. CORS:

- REST API (`/rest/v1/*`) и Auth (`/auth/v1/*`) отвечают CORS-заголовками по умолчанию — допускают запросы с `apikey`/publishable-ключом из браузера; дополнительный серверный CORS-конфиг не требуется;
- для флоу входа (подтверждение OTP при редиректах) в дашборде задаются **Site URL** (`https://nikitin022.github.io/OTUS_DZ5/`) и **Redirect URLs** (тот же домен) — Authentication → URL Configuration;
- все прочие домены в Redirect URLs не добавляются.