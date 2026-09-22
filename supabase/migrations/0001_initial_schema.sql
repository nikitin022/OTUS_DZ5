-- ============================================================================
-- «Капля» — схема базы данных (PostgreSQL / Supabase)
-- Миграция 0001: перечисления, таблицы, связи, индексы, триггеры
--
-- Источник истины: модели в src/types/index.ts и ТЗ (разделы 7, 8).
-- Соглашения: snake_case, UUID PK (gen_random_uuid), timestamptz, FK с ON DELETE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Перечисления (значения совпадают с union-типами фронтенда)
-- ----------------------------------------------------------------------------

create type blood_group as enum ('1', '2', '3', '4');
create type rh_factor as enum ('+', '-');
create type urgency as enum ('обычная', 'срочная', 'критичная');
create type request_status as enum ('active', 'closed');
create type appointment_status as enum ('pending', 'confirmed', 'cancelled', 'missed');
create type notification_type as enum ('request', 'reminder', 'system');
create type delivery_status as enum ('sent', 'delivered', 'failed');
create type donation_type as enum ('цельная кровь', 'плазма', 'тромбоциты', 'эритроциты');
create type donation_status as enum ('завершена', 'отменена', 'не состоялась');

-- Роль пользователя системы: донор или координатор центра (ТЗ, раздел 3)
create type user_role as enum ('donor', 'coordinator');

-- ----------------------------------------------------------------------------
-- Таблица: donors (сущность «Донор»)
-- ----------------------------------------------------------------------------

create table donors (
  id                   uuid primary key default gen_random_uuid(),
  -- Связь с учётной записью Supabase Auth (аутентификация по телефону + OTP)
  auth_user_id         uuid unique references auth.users (id) on delete cascade,
  phone                text not null unique,
  role                 user_role not null default 'donor',
  blood_group          blood_group not null,
  rh_factor            rh_factor not null,
  -- Радиус поиска центров, км (FR-1.1)
  search_radius_km     integer not null default 50 check (search_radius_km between 1 and 500),
  -- Явные согласия (FR-1.2)
  consent_geolocation  boolean not null default false,
  consent_push         boolean not null default false,
  -- Дата последней донации (контроль интервала ≥ 60 дней, FR-5)
  last_donation_at     timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table donors is 'Доноры и координаторы центров; связь с Supabase Auth через auth_user_id';
comment on column donors.search_radius_km is 'Радиус поиска центров, км, допустимо 1-500';

-- ----------------------------------------------------------------------------
-- Таблица: centers (сущность «Центр»)
-- ----------------------------------------------------------------------------

create table centers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  address        text not null,
  -- Координаты фронтенда [широта, долгота] разделены на два поля
  latitude       double precision not null check (latitude between -90 and 90),
  longitude      double precision not null check (longitude between -180 and 180),
  -- График работы: {"0": "выходной", "1": "08:00-15:00", ...}, 0 = воскресенье
  working_hours  jsonb not null default '{}'::jsonb,
  phone          text not null,
  is_verified    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table centers is 'Центры крови: адрес, координаты, график работы, статус верификации';

-- ----------------------------------------------------------------------------
-- Таблица: blood_requests (сущность «Заявка (потребность)»)
-- ----------------------------------------------------------------------------

create table blood_requests (
  id            uuid primary key default gen_random_uuid(),
  center_id     uuid not null references centers (id) on delete cascade,
  blood_group   blood_group not null,
  rh_factor     rh_factor not null,
  volume_ml     integer not null check (volume_ml > 0),
  urgency       urgency not null default 'обычная',
  collected_ml  integer not null default 0 check (collected_ml >= 0),
  status        request_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint collected_not_exceeds_volume check (collected_ml <= volume_ml)
);

comment on table blood_requests is 'Заявки центров на кровь: группа, объём, срочность, прогресс сбора';

-- Индекс живой ленты: активные заявки, сортировка по свежести
create index idx_blood_requests_feed on blood_requests (status, urgency, created_at desc);
create index idx_blood_requests_center on blood_requests (center_id);

-- ----------------------------------------------------------------------------
-- Таблица: appointments (сущность «Запись»)
-- ----------------------------------------------------------------------------

create table appointments (
  id          uuid primary key default gen_random_uuid(),
  donor_id    uuid not null references donors (id) on delete cascade,
  center_id   uuid not null references centers (id) on delete cascade,
  date        date not null,
  time        time not null,
  status      appointment_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table appointments is 'Записи на донацию: дата, слот времени, статус подтверждения';

create index idx_appointments_donor on appointments (donor_id);
create index idx_appointments_center_date on appointments (center_id, date);

-- ----------------------------------------------------------------------------
-- Таблица: request_responses (сущность «Отклик»)
-- ----------------------------------------------------------------------------

create table request_responses (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references blood_requests (id) on delete cascade,
  donor_id    uuid not null references donors (id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- Донор откликается на заявку не более одного раза
  unique (request_id, donor_id)
);

comment on table request_responses is 'Отклики доноров на заявки ленты';

create index idx_request_responses_request on request_responses (request_id);
create index idx_request_responses_donor on request_responses (donor_id);

-- ----------------------------------------------------------------------------
-- Таблица: notifications (сущность «Уведомление»)
-- ----------------------------------------------------------------------------

create table notifications (
  id               uuid primary key default gen_random_uuid(),
  donor_id         uuid not null references donors (id) on delete cascade,
  type             notification_type not null,
  text             text not null,
  delivery_status  delivery_status not null default 'sent',
  created_at       timestamptz not null default now()
);

comment on table notifications is 'Push-уведомления донорам и статус их доставки';

create index idx_notifications_donor on notifications (donor_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Таблица: donation_history (сущность «История донаций», FR-6)
-- ----------------------------------------------------------------------------

create table donation_history (
  id          uuid primary key default gen_random_uuid(),
  donor_id    uuid not null references donors (id) on delete cascade,
  center_id   uuid not null references centers (id),
  date        date not null,
  volume_ml   integer not null check (volume_ml > 0),
  type        donation_type not null,
  status      donation_status not null,
  created_at  timestamptz not null default now()
);

comment on table donation_history is 'История донаций донора (название центра извлекается join с centers)';

create index idx_donation_history_donor on donation_history (donor_id, date desc);

-- ----------------------------------------------------------------------------
-- Таблица: notification_settings (сущность «Настройки», 1:1 с донором)
-- ----------------------------------------------------------------------------

create table notification_settings (
  donor_id         uuid primary key references donors (id) on delete cascade,
  notify_request   boolean not null default true,
  notify_reminder  boolean not null default true,
  notify_system    boolean not null default true,
  -- Мгновенно либо дайджестом
  frequency        text not null default 'instant' check (frequency in ('instant', 'daily', 'weekly'))
);

comment on table notification_settings is 'Настройки уведомлений донора (типы и частота)';

-- ----------------------------------------------------------------------------
-- Триггер updated_at
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_donors_updated_at
  before update on donors
  for each row execute function set_updated_at();

create trigger trg_centers_updated_at
  before update on centers
  for each row execute function set_updated_at();

create trigger trg_blood_requests_updated_at
  before update on blood_requests
  for each row execute function set_updated_at();

create trigger trg_appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();

