-- ============================================================================
-- «Капля» — миграция 0003: укрепление безопасности RLS
--
-- 1. Helper-функции перенесены в схему private (не доступны через REST API);
-- 2. search_path функций зафиксирован (защита от подмены объектов);
-- 3. политики FOR ALL на centers/blood_requests разделены на
--    insert/update/delete — устранено дублирование с публичным SELECT;
-- 4. auth.uid() обёрнут в (select ...) — вычисление один раз на запрос;
-- 5. добавлен недостающий индекс FK donation_history.center_id.
-- ============================================================================

create schema if not exists private;

revoke all on schema private from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 1. Пересоздание политик, использующих helper-функции (до удаления функций)
-- ----------------------------------------------------------------------------

drop policy if exists appointments_select_own on appointments;
drop policy if exists appointments_insert_own on appointments;
drop policy if exists appointments_update_own on appointments;
drop policy if exists appointments_delete_own on appointments;
drop policy if exists request_responses_insert_own on request_responses;
drop policy if exists request_responses_delete_own on request_responses;
drop policy if exists notifications_select_own on notifications;
drop policy if exists notifications_update_own on notifications;
drop policy if exists donation_history_select_own on donation_history;
drop policy if exists notification_settings_all_own on notification_settings;
drop policy if exists centers_manage_coordinator on centers;
drop policy if exists blood_requests_manage_coordinator on blood_requests;
drop policy if exists donors_select_own on donors;
drop policy if exists donors_insert_own on donors;
drop policy if exists donors_update_own on donors;
drop policy if exists donors_delete_own on donors;

-- ----------------------------------------------------------------------------
-- 2. Helper-функции в приватной схеме, search_path зафиксирован
-- ----------------------------------------------------------------------------

drop function if exists public.auth_donor_id();
drop function if exists public.is_coordinator();

create or replace function private.auth_donor_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.id from public.donors d where d.auth_user_id = auth.uid()
$$;

create or replace function private.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.donors d
    where d.auth_user_id = auth.uid() and d.role = 'coordinator'
  )
$$;

revoke all on function private.auth_donor_id() from public, anon;
revoke all on function private.is_coordinator() from public, anon;
grant execute on function private.auth_donor_id() to authenticated;
grant execute on function private.is_coordinator() to authenticated;
grant usage on schema private to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Фиксация search_path триггерной функции
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Политики donors: auth.uid() вычисляется один раз на запрос
-- ----------------------------------------------------------------------------

create policy "donors_select_own" on donors
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy "donors_insert_own" on donors
  for insert to authenticated
  with check (auth_user_id = (select auth.uid()));

create policy "donors_update_own" on donors
  for update to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

create policy "donors_delete_own" on donors
  for delete to authenticated
  using (auth_user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. centers: публичное чтение + раздельные операции координатора
-- ----------------------------------------------------------------------------

create policy "centers_insert_coordinator" on centers
  for insert to authenticated
  with check (private.is_coordinator());

create policy "centers_update_coordinator" on centers
  for update to authenticated
  using (private.is_coordinator())
  with check (private.is_coordinator());

create policy "centers_delete_coordinator" on centers
  for delete to authenticated
  using (private.is_coordinator());

-- ----------------------------------------------------------------------------
-- 6. blood_requests: раздельные операции координатора (FR-7)
-- ----------------------------------------------------------------------------

create policy "blood_requests_insert_coordinator" on blood_requests
  for insert to authenticated
  with check (private.is_coordinator());

create policy "blood_requests_update_coordinator" on blood_requests
  for update to authenticated
  using (private.is_coordinator())
  with check (private.is_coordinator());

create policy "blood_requests_delete_coordinator" on blood_requests
  for delete to authenticated
  using (private.is_coordinator());

-- ----------------------------------------------------------------------------
-- 7. appointments: владелец-донор
-- ----------------------------------------------------------------------------

create policy "appointments_select_own" on appointments
  for select to authenticated
  using (donor_id = (select private.auth_donor_id()));

create policy "appointments_insert_own" on appointments
  for insert to authenticated
  with check (donor_id = (select private.auth_donor_id()));

create policy "appointments_update_own" on appointments
  for update to authenticated
  using (donor_id = (select private.auth_donor_id()))
  with check (donor_id = (select private.auth_donor_id()));

create policy "appointments_delete_own" on appointments
  for delete to authenticated
  using (donor_id = (select private.auth_donor_id()));

-- ----------------------------------------------------------------------------
-- 8. request_responses: чтение публично, запись — автор
-- ----------------------------------------------------------------------------

create policy "request_responses_insert_own" on request_responses
  for insert to authenticated
  with check (donor_id = (select private.auth_donor_id()));

create policy "request_responses_delete_own" on request_responses
  for delete to authenticated
  using (donor_id = (select private.auth_donor_id()));

-- ----------------------------------------------------------------------------
-- 9. notifications и donation_history: чтение только владельцем
-- ----------------------------------------------------------------------------

create policy "notifications_select_own" on notifications
  for select to authenticated
  using (donor_id = (select private.auth_donor_id()));

create policy "notifications_update_own" on notifications
  for update to authenticated
  using (donor_id = (select private.auth_donor_id()))
  with check (donor_id = (select private.auth_donor_id()));

create policy "donation_history_select_own" on donation_history
  for select to authenticated
  using (donor_id = (select private.auth_donor_id()));

-- ----------------------------------------------------------------------------
-- 10. notification_settings: владелец
-- ----------------------------------------------------------------------------

create policy "notification_settings_all_own" on notification_settings
  for all to authenticated
  using (donor_id = (select private.auth_donor_id()))
  with check (donor_id = (select private.auth_donor_id()));

-- ----------------------------------------------------------------------------
-- 11. Недостающий индекс FK
-- ----------------------------------------------------------------------------

create index idx_donation_history_center on donation_history (center_id);