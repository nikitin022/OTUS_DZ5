-- ============================================================================
-- «Капля» — миграция 0005: API-функции (RPC)
--
-- Кастомные операции контракта API, требующие бизнес-проверок:
--   • create_appointment     — запись на донацию (FR-5): интервал ≥ 60 дней,
--                              свободный слот, одна запись в день у донора;
--   • register_donor_profile — создание/обновление профиля донора после
--                              регистрации (данные из JWT, FR-1).
--
-- Функции SECURITY DEFINER с зафиксированным search_path; ошибки —
-- RAISE EXCEPTION с человекочитаемым сообщением (матрица ошибок, ТЗ разд. 6).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- create_appointment: запись на донацию
-- Вызывается авторизованным донором: POST /rest/v1/rpc/create_appointment
-- ----------------------------------------------------------------------------

create or replace function public.create_appointment(
  p_center_id uuid,
  p_date date,
  p_time time
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_donor_id uuid;
  v_last_donation timestamptz;
  v_result public.appointments%rowtype;
begin
  v_donor_id := private.auth_donor_id();

  if v_donor_id is null then
    raise exception 'Требуется вход в систему: запись доступна только авторизованным донорам'
      using errcode = 'P0001';
  end if;

  -- Контроль интервала между донациями (FR-5: не менее 60 дней)
  select d.last_donation_at into v_last_donation
  from public.donors d
  where d.id = v_donor_id;

  if v_last_donation is not null
     and (p_date + p_time) < (v_last_donation + interval '60 days') then
    raise exception 'Интервал не соблюдён: между донациями должно пройти не менее 60 дней'
      using errcode = 'P0001';
  end if;

  -- Слот занят другим донором (активные записи: pending/confirmed)
  if exists (
    select 1
    from public.appointments a
    where a.center_id = p_center_id
      and a.date = p_date
      and a.time = p_time
      and a.status in ('pending', 'confirmed')
  ) then
    raise exception 'Слот занят: выберите другое время'
      using errcode = 'P0001';
  end if;

  -- У донора уже есть активная запись на эту дату
  if exists (
    select 1
    from public.appointments a
    where a.donor_id = v_donor_id
      and a.date = p_date
      and a.status in ('pending', 'confirmed')
  ) then
    raise exception 'У вас уже есть запись на эту дату'
      using errcode = 'P0001';
  end if;

  insert into public.appointments (donor_id, center_id, date, time, status)
  values (v_donor_id, p_center_id, p_date, p_time, 'pending')
  returning * into v_result;

  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- register_donor_profile: профиль донора после регистрации (FR-1)
-- Вызывается авторизованным пользователем: POST /rest/v1/rpc/register_donor_profile
-- Идемпотентна: повторный вызов обновляет существующий профиль.
-- ----------------------------------------------------------------------------

create or replace function public.register_donor_profile(
  p_phone text,
  p_blood_group public.blood_group,
  p_rh_factor public.rh_factor,
  p_search_radius_km integer default 50,
  p_consent_geolocation boolean default false,
  p_consent_push boolean default false
)
returns public.donors
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_user uuid := auth.uid();
  v_donor public.donors%rowtype;
begin
  if v_auth_user is null then
    raise exception 'Требуется вход в систему'
      using errcode = 'P0001';
  end if;

  if p_search_radius_km < 1 or p_search_radius_km > 500 then
    raise exception 'Радиус поиска должен быть в диапазоне 1-500 км'
      using errcode = 'P0001';
  end if;

  insert into public.donors
    (auth_user_id, phone, blood_group, rh_factor,
     search_radius_km, consent_geolocation, consent_push)
  values
    (v_auth_user, p_phone, p_blood_group, p_rh_factor,
     p_search_radius_km, p_consent_geolocation, p_consent_push)
  on conflict (auth_user_id) do update
    set phone               = excluded.phone,
        blood_group         = excluded.blood_group,
        rh_factor           = excluded.rh_factor,
        search_radius_km    = excluded.search_radius_km,
        consent_geolocation = excluded.consent_geolocation,
        consent_push        = excluded.consent_push,
        updated_at          = now()
  returning * into v_donor;

  -- Настройки уведомлений создаются вместе с профилем (1:1)
  insert into public.notification_settings (donor_id)
  values (v_donor.id)
  on conflict (donor_id) do nothing;

  return v_donor;
end;
$$;

-- ----------------------------------------------------------------------------
-- Привилегии: RPC только для авторизованных пользователей
-- ----------------------------------------------------------------------------

revoke execute on function public.create_appointment(uuid, date, time) from public, anon;
revoke execute on function public.register_donor_profile(text, public.blood_group, public.rh_factor, integer, boolean, boolean) from public, anon;

grant execute on function public.create_appointment(uuid, date, time) to authenticated;
grant execute on function public.register_donor_profile(text, public.blood_group, public.rh_factor, integer, boolean, boolean) to authenticated;