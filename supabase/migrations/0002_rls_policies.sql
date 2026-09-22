-- ============================================================================
-- Â«ÐšÐ°Ð¿Ð»ÑÂ» â€” Ð¼Ð¸Ð³Ñ€Ð°Ñ†Ð¸Ñ 0002: Row Level Security
--
-- ÐœÐ¾Ð´ÐµÐ»ÑŒ Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð° (Ð¢Ð—, Ñ€Ð°Ð·Ð´ÐµÐ»Ñ‹ 3 Ð¸ 6):
--   â€¢ Ð³Ð¾ÑÑ‚ÑŒ (anon)            â€” Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ Ñ†ÐµÐ½Ñ‚Ñ€Ð¾Ð², Ð·Ð°ÑÐ²Ð¾Ðº (Ð»ÐµÐ½Ñ‚Ñ‹) Ð¸ Ð¾Ñ‚ÐºÐ»Ð¸ÐºÐ¾Ð²;
--   â€¢ Ð´Ð¾Ð½Ð¾Ñ€ (authenticated)   â€” ÑÐ²Ð¾Ð¹ Ð¿Ñ€Ð¾Ñ„Ð¸Ð»ÑŒ, ÑÐ²Ð¾Ð¸ Ð·Ð°Ð¿Ð¸ÑÐ¸, Ð¾Ñ‚ÐºÐ»Ð¸ÐºÐ¸, Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸;
--   â€¢ ÐºÐ¾Ð¾Ñ€Ð´Ð¸Ð½Ð°Ñ‚Ð¾Ñ€             â€” ÑƒÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ðµ Ð·Ð°ÑÐ²ÐºÐ°Ð¼Ð¸ Ð¸ Ñ†ÐµÐ½Ñ‚Ñ€Ð¾Ð¼;
--   â€¢ service_role            â€” ÑÐ¸ÑÑ‚ÐµÐ¼Ð½Ñ‹Ðµ Ð¾Ð¿ÐµÑ€Ð°Ñ†Ð¸Ð¸ (ÑƒÐ²ÐµÐ´Ð¾Ð¼Ð»ÐµÐ½Ð¸Ñ, Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ñ Ð´Ð¾Ð½Ð°Ñ†Ð¸Ð¹),
--                               RLS Ð´Ð»Ñ service_role Ð½Ðµ Ð¿Ñ€Ð¸Ð¼ÐµÐ½ÑÐµÑ‚ÑÑ.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Ð’ÑÐ¿Ð¾Ð¼Ð¾Ð³Ð°Ñ‚ÐµÐ»ÑŒÐ½Ñ‹Ðµ Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¸ (security definer: Ð½Ðµ Ð¿Ð¾Ð´Ð²ÐµÑ€Ð¶ÐµÐ½Ñ‹ RLS Ð¸ Ð½Ðµ Ñ€ÐµÐºÑƒÑ€ÑÐ¸Ð²Ð½Ñ‹)
-- ----------------------------------------------------------------------------

-- id Ð¿Ñ€Ð¾Ñ„Ð¸Ð»Ñ Ð´Ð¾Ð½Ð¾Ñ€Ð° Ñ‚ÐµÐºÑƒÑ‰ÐµÐ³Ð¾ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ (Ð¸Ð»Ð¸ NULL Ð´Ð»Ñ Ð³Ð¾ÑÑ‚Ñ)
create or replace function auth_donor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select d.id from donors d where d.auth_user_id = auth.uid()
$$;

-- Ñ‚ÐµÐºÑƒÑ‰Ð¸Ð¹ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ â€” ÐºÐ¾Ð¾Ñ€Ð´Ð¸Ð½Ð°Ñ‚Ð¾Ñ€?
create or replace function is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from donors d
    where d.auth_user_id = auth.uid() and d.role = 'coordinator'
  )
$$;

revoke all on function auth_donor_id() from anon;
revoke all on function is_coordinator() from anon;
grant execute on function auth_donor_id() to authenticated;
grant execute on function is_coordinator() to authenticated;

-- ----------------------------------------------------------------------------
-- Ð’ÐºÐ»ÑŽÑ‡ÐµÐ½Ð¸Ðµ RLS Ð½Ð° Ð²ÑÐµÑ… Ñ‚Ð°Ð±Ð»Ð¸Ñ†Ð°Ñ…
-- ----------------------------------------------------------------------------

alter table donors                enable row level security;
alter table centers               enable row level security;
alter table blood_requests        enable row level security;
alter table appointments          enable row level security;
alter table request_responses     enable row level security;
alter table notifications         enable row level security;
alter table donation_history      enable row level security;
alter table notification_settings enable row level security;

-- ----------------------------------------------------------------------------
-- donors: Ð¿Ñ€Ð¾Ñ„Ð¸Ð»ÑŒ Ð²Ð¸Ð´Ð¸Ñ‚ Ð¸ Ð¼ÐµÐ½ÑÐµÑ‚ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð²Ð»Ð°Ð´ÐµÐ»ÐµÑ†; ÑÐ¾Ð·Ð´Ð°Ñ‘Ñ‚ ÑÐ°Ð¼ Ð¿Ñ€Ð¸ Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ð¸
-- ----------------------------------------------------------------------------

create policy "donors_select_own" on donors
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy "donors_insert_own" on donors
  for insert to authenticated
  with check (auth_user_id = auth.uid());

create policy "donors_update_own" on donors
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "donors_delete_own" on donors
  for delete to authenticated
  using (auth_user_id = auth.uid());

-- Ð Ð¾Ð»ÑŒ (donor/coordinator) Ð½ÐµÐ»ÑŒÐ·Ñ Ð¼ÐµÐ½ÑÑ‚ÑŒ Ñ‡ÐµÑ€ÐµÐ· ÐºÐ»Ð¸ÐµÐ½Ñ‚ÑÐºÐ¸Ð¹ API:
-- ÐºÐ¾Ð»Ð¾Ð½ÐºÐ° Ð¸ÑÐºÐ»ÑŽÑ‡Ð°ÐµÑ‚ÑÑ Ð¸Ð· UPDATE-Ð¿Ñ€Ð¸Ð²Ð¸Ð»ÐµÐ³Ð¸Ð¹ Ñ€Ð¾Ð»Ð¸ authenticated
revoke update on table donors from authenticated;
grant update (phone, blood_group, rh_factor, search_radius_km,
              consent_geolocation, consent_push, last_donation_at)
  on donors to authenticated;

-- ----------------------------------------------------------------------------
-- centers: Ð¿ÑƒÐ±Ð»Ð¸Ñ‡Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ; Ð¸Ð·Ð¼ÐµÐ½ÐµÐ½Ð¸Ðµ â€” ÐºÐ¾Ð¾Ñ€Ð´Ð¸Ð½Ð°Ñ‚Ð¾Ñ€Ð¾Ð¼
-- ----------------------------------------------------------------------------

create policy "centers_select_public" on centers
  for select
  using (true);

create policy "centers_manage_coordinator" on centers
  for all to authenticated
  using (is_coordinator())
  with check (is_coordinator());

-- ----------------------------------------------------------------------------
-- blood_requests: Ð»ÐµÐ½Ñ‚Ð° Ð¿ÑƒÐ±Ð»Ð¸Ñ‡Ð½Ð°; Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸Ñ/Ð²ÐµÐ´ÐµÐ½Ð¸Ðµ â€” ÐºÐ¾Ð¾Ñ€Ð´Ð¸Ð½Ð°Ñ‚Ð¾Ñ€Ð¾Ð¼ (FR-7)
-- ----------------------------------------------------------------------------

create policy "blood_requests_select_public" on blood_requests
  for select
  using (true);

create policy "blood_requests_manage_coordinator" on blood_requests
  for all to authenticated
  using (is_coordinator())
  with check (is_coordinator());

-- ----------------------------------------------------------------------------
-- appointments: Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð²Ð»Ð°Ð´ÐµÐ»ÐµÑ†-Ð´Ð¾Ð½Ð¾Ñ€ (Ð¿Ñ€Ð¸Ð²Ð°Ñ‚Ð½Ð¾ÑÑ‚ÑŒ, FR-5)
-- ----------------------------------------------------------------------------

create policy "appointments_select_own" on appointments
  for select to authenticated
  using (donor_id = auth_donor_id());

create policy "appointments_insert_own" on appointments
  for insert to authenticated
  with check (donor_id = auth_donor_id());

create policy "appointments_update_own" on appointments
  for update to authenticated
  using (donor_id = auth_donor_id())
  with check (donor_id = auth_donor_id());

create policy "appointments_delete_own" on appointments
  for delete to authenticated
  using (donor_id = auth_donor_id());

-- ----------------------------------------------------------------------------
-- request_responses: Ð¾Ñ‚ÐºÐ»Ð¸ÐºÐ¸ Ð¿ÑƒÐ±Ð»Ð¸Ñ‡Ð½Ñ‹ Ð´Ð»Ñ Ñ‡Ñ‚ÐµÐ½Ð¸Ñ (FR-8); ÑÐ¾Ð·Ð´Ð°Ñ‘Ñ‚ Ð¸
-- ÑƒÐ´Ð°Ð»ÑÐµÑ‚ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð°Ð²Ñ‚Ð¾Ñ€-Ð´Ð¾Ð½Ð¾Ñ€; Ð¾Ð´Ð¸Ð½ Ð¾Ñ‚ÐºÐ»Ð¸Ðº Ð½Ð° Ð·Ð°ÑÐ²ÐºÑƒ Ð·Ð°Ñ‰Ð¸Ñ‰Ñ‘Ð½ UNIQUE
-- ----------------------------------------------------------------------------

create policy "request_responses_select_public" on request_responses
  for select
  using (true);

create policy "request_responses_insert_own" on request_responses
  for insert to authenticated
  with check (donor_id = auth_donor_id());

create policy "request_responses_delete_own" on request_responses
  for delete to authenticated
  using (donor_id = auth_donor_id());

-- ----------------------------------------------------------------------------
-- notifications: Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ/Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ðµ ÑÑ‚Ð°Ñ‚ÑƒÑÐ° Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ¸ â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð²Ð»Ð°Ð´ÐµÐ»ÑŒÑ†ÐµÐ¼;
-- Ð·Ð°Ð¿Ð¸ÑÑŒ Ð²Ñ‹Ð¿Ð¾Ð»Ð½ÑÐµÑ‚ ÑÐµÑ€Ð²ÐµÑ€Ð½Ñ‹Ð¹ ÐºÐ¾Ð½Ñ‚ÑƒÑ€ (service_role), Ð¿Ð¾Ð»Ð¸Ñ‚Ð¸Ðº insert Ð½ÐµÑ‚
-- ----------------------------------------------------------------------------

create policy "notifications_select_own" on notifications
  for select to authenticated
  using (donor_id = auth_donor_id());

create policy "notifications_update_own" on notifications
  for update to authenticated
  using (donor_id = auth_donor_id())
  with check (donor_id = auth_donor_id());

-- ----------------------------------------------------------------------------
-- donation_history: Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð²Ð»Ð°Ð´ÐµÐ»ÑŒÑ†ÐµÐ¼ (Ð¿Ñ€Ð¸Ð²Ð°Ñ‚Ð½Ð¾ÑÑ‚ÑŒ, FR-6);
-- Ð½Ð°Ð¿Ð¾Ð»Ð½ÐµÐ½Ð¸Ðµ â€” ÑÐµÑ€Ð²ÐµÑ€Ð½Ñ‹Ð¹ ÐºÐ¾Ð½Ñ‚ÑƒÑ€ (service_role), Ð¿Ð¾Ð»Ð¸Ñ‚Ð¸Ðº Ð½Ð° Ð·Ð°Ð¿Ð¸ÑÑŒ Ð½ÐµÑ‚
-- ----------------------------------------------------------------------------

create policy "donation_history_select_own" on donation_history
  for select to authenticated
  using (donor_id = auth_donor_id());

-- ----------------------------------------------------------------------------
-- notification_settings: Ð¿Ð¾Ð»Ð½Ñ‹Ð¹ Ð´Ð¾ÑÑ‚ÑƒÐ¿ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð²Ð»Ð°Ð´ÐµÐ»ÑŒÑ†Ð° (1:1 Ñ Ð´Ð¾Ð½Ð¾Ñ€Ð¾Ð¼)
-- ----------------------------------------------------------------------------

create policy "notification_settings_all_own" on notification_settings
  for all to authenticated
  using (donor_id = auth_donor_id())
  with check (donor_id = auth_donor_id());