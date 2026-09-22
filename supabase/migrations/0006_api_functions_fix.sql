-- ============================================================================
-- «Капля» — миграция 0006: исправление create_appointment
-- INSERT ... RETURNING в PL/pgSQL требует INTO-переменную для возврата строки.
-- ============================================================================

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