# API «Капля» — справочник endpoints

REST API генерируется автоматически (PostgREST) из схемы базы данных: каждая таблица доступна как ресурс `/rest/v1/<таблица>`, Postgres-функции — как `/rest/v1/rpc/<функция>`. Доступ к данным ограничен политиками Row Level Security (см. `docs/database_schema.md`, раздел 10).

## 1. Общие сведения

- **Base URL:** `https://<project-ref>.supabase.co/rest/v1`
- **Формат данных:** JSON (UTF-8)
- **Заголовки запросов:**
  - `apikey: <publishable key>` — обязателен всегда;
  - `Authorization: Bearer <JWT>` — для операций авторизованного пользователя (донор/координатор); для гостевых чтений достаточно `apikey`;
  - `Content-Type: application/json` — для POST/PATCH;
  - `Prefer: return=representation` — вернуть созданный объект в ответе.

## 2. Соответствие контракту ApiClient

| Метод ApiClient (ТЗ, разд. 8) | HTTP endpoint | Роль |
|---|---|---|
| `getCenters()` | `GET /rest/v1/centers` | гость, донор, координатор |
| `getRequests(filters)` | `GET /rest/v1/blood_requests` | гость, донор, координатор |
| `createRequest(...)` | `POST /rest/v1/blood_requests` | координатор (RLS) |
| `updateRequest(id, patch)` | `PATCH /rest/v1/blood_requests?id=eq.<id>` | координатор (RLS) |
| `createAppointment(...)` | `POST /rest/v1/rpc/create_appointment` | донор |
| `updateAppointment(id, patch)` | `PATCH /rest/v1/appointments?id=eq.<id>` | донор — владелец (RLS) |
| `getDonationHistory(donorId)` | `GET /rest/v1/donation_history?donor_id=eq.<id>` | донор — владелец (RLS) |
| `getRequestResponses(requestId)` | `GET /rest/v1/request_responses?request_id=eq.<id>` | гость, донор, координатор |
| `subscribeToPush(...)` | Шаг «Безопасность»: требует Auth/Web Push, вынесен отдельно | донор |

Дополнительная RPC-операция: `POST /rest/v1/rpc/register_donor_profile` — создание профиля донора после входа (FR-1).

## 3. Приёмы запросов (PostgREST)

| Задача | Пример |
|---|---|
| Фильтр по значению | `?status=eq.active&blood_group=eq.1` |
| Фильтр по списку | `?urgency=in.(срочная,критичная)` |
| Сортировка | `?order=created_at.desc` |
| Пагинация | `?limit=10&offset=20` или заголовок `Range: 0-9` |
| Выбор полей | `?select=name,address,latitude,longitude` |
| Связанные данные | `?select=*,centers(name,address)` (FK blood_requests→centers) |
| Числовые сравнения | `?collected_ml=lt.volume_ml` и `?volume_ml=gte.500` |

<!-- PART2 -->
## 4. Примеры запросов

### 4.1. Список центров (гостевой доступ)

```bash
curl "https://<project-ref>.supabase.co/rest/v1/centers?select=name,address,latitude,longitude,is_verified&order=name.asc" \\
  -H "apikey: <publishable-key>"
```

Ответ `200 OK`:

```json
[{"name":"Центр крови ФМБА России","address":"г. Москва, Щукинская ул., 6",
  "latitude":55.8072,"longitude":37.4919,"is_verified":true}]
```

### 4.2. Живая лента заявок с фильтрами и связанным центром

```bash
curl "https://<project-ref>.supabase.co/rest/v1/blood_requests?status=eq.active&urgency=in.(срочная,критичная)&select=blood_group,rh_factor,volume_ml,urgency,collected_ml,created_at,centers(name,address)&order=created_at.desc&limit=10" \\
  -H "apikey: <publishable-key>"
```

### 4.3. Публикация заявки координатором

```bash
curl -X POST "https://<project-ref>.supabase.co/rest/v1/blood_requests" \\
  -H "apikey: <publishable-key>" -H "Authorization: Bearer <JWT-координатора>" \\
  -H "Content-Type: application/json" -H "Prefer: return=representation" \\
  -d '{"center_id":"<uuid>","blood_group":"1","rh_factor":"+","volume_ml":900,"urgency":"срочная"}'
```

Ответ `201 Created` — созданная заявка (id, collected_ml=0, status=active подставляются автоматически).

### 4.4. Закрытие/правка заявки

```bash
curl -X PATCH "https://<project-ref>.supabase.co/rest/v1/blood_requests?id=eq.<uuid>" \\
  -H "apikey: <publishable-key>" -H "Authorization: Bearer <JWT-координатора>" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"closed","collected_ml":900}'
```

### 4.5. Запись на донацию (RPC, донор)

```bash
curl -X POST "https://<project-ref>.supabase.co/rest/v1/rpc/create_appointment" \\
  -H "apikey: <publishable-key>" -H "Authorization: Bearer <JWT-донора>" \\
  -H "Content-Type: application/json" \\
  -d '{"p_center_id":"<uuid>","p_date":"2026-11-01","p_time":"10:00"}'
```

Ответ `200 OK` — запись со статусом `pending`. Возможные ошибки: см. раздел 5.

### 4.6. Регистрация профиля донора (RPC, после входа)

```bash
curl -X POST "https://<project-ref>.supabase.co/rest/v1/rpc/register_donor_profile" \\
  -H "apikey: <publishable-key>" -H "Authorization: Bearer <JWT>" \\
  -H "Content-Type: application/json" \\
  -d '{"p_phone":"+79991234567","p_blood_group":"2","p_rh_factor":"-","p_search_radius_km":100,"p_consent_geolocation":true,"p_consent_push":true}'
```

### 4.7. Отмена записи

```bash
curl -X PATCH "https://<project-ref>.supabase.co/rest/v1/appointments?id=eq.<uuid>" \\
  -H "apikey: <publishable-key>" -H "Authorization: Bearer <JWT-донора>" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"cancelled"}'
```

## 5. Обработка ошибок

Формат ошибки PostgREST:

```json
{"code":"P0001","details":null,"hint":null,"message":"Слот занят: выберите другое время"}
```

Бизнес-ошибки возвращают человекочитаемое сообщение на русском (`message`) — фронтенд отображает его напрямую (матрица ошибок, ТЗ разд. 6):

| Ситуация | message | HTTP |
|---|---|---|
| Запись без входа | `Требуется вход в систему: запись доступна только авторизованным донорам` | 401 |
| Интервал < 60 дней | `Интервал не соблюдён: между донациями должно пройти не менее 60 дней` | 400 |
| Слот занят | `Слот занят: выберите другое время` | 400 |
| Повторная запись в день | `У вас уже есть запись на эту дату` | 400 |
| Радиус вне 1–500 км | `Радиус поиска должен быть в диапазоне 1-500 км` | 400 |
| Запись координатором без роли | `new row violates row-level security policy for table "blood_requests"` | 401/403 |
| Нет прав на RPC | `permission denied for function <имя>` | 401 |
| Некорректное тело запроса | `Empty or invalid json` | 400 |

## 6. Результаты тестирования endpoints

Тестирование выполнено реальными HTTP-запросами (curl) по продакшн-URL проекта.

| # | Запрос | Ожидание | Результат |
|---|---|---|---|
| 1 | `GET /centers` (anon) | 200, справочник | ✅ 200, 8 центров |
| 2 | `GET /blood_requests?status=eq.active&blood_group=eq.1` (anon) | 200, фильтрация | ✅ 200, 1 заявка из 4 |
| 3 | `POST /blood_requests` (anon) | отказ RLS | ✅ 401, `new row violates row-level security policy` |
| 4 | `PATCH /appointments` (anon) | доступ только владельцу | ✅ 204, изменено 0 строк (RLS скрывает чужие строки) |
| 5 | `POST /rpc/create_appointment` (anon) | запрет вызова | ✅ 401, `permission denied for function` |
| 6 | `POST /rpc/register_donor_profile` (anon) | запрет вызова | ✅ 401, `permission denied for function` |
| 7 | `GET /appointments` (anon) | приватные данные скрыты | ✅ 200, `[]` |

Сценарии авторизованного донора (RPC-бизнес-логика) проверены под ролью `authenticated` с тестовым JWT:

| # | Сценарий | Результат |
|---|---|---|
| A | `register_donor_profile` — создание профиля и настроек | ✅ SUCCESS |
| B | `create_appointment` — первая запись | ✅ SUCCESS, статус `pending` |
| C | Повторная запись в тот же день | ✅ отклонена (`У вас уже есть запись на эту дату`) |
| D | Интервал < 60 дней | ✅ отклонена (`Интервал не соблюдён…`) |
| E | Интервал ≥ 60 дней | ✅ SUCCESS |
| F | Радиус 700 км | ✅ отклонён (`Радиус поиска должен быть в диапазоне 1-500 км`) |
| G | Занятый слот другим донором | ✅ отклонена (`Слот занят: выберите другое время`) |

Тестовые данные удалены (транзакции с откатом); в базе остались только справочные центры и демо-заявки.

## 7. Открытые вопросы

- `subscribeToPush` — реализуется вместе с аутентификацией и Web Push (Шаг «Безопасность»);
- автообновление прогресса заявок (`collected_ml`) — по факту подтверждённых донаций, системный контур (`service_role`);
- CORS: домен фронтенда (GitHub Pages) добавляется в настройках Auth/API проекта Supabase.