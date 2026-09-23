-- ============================================================================
-- «Капля» — миграция 0007: подписки на push-уведомления (FR-4)
--
-- Хранит Web Push subscription донора; RPC register_push_subscription
-- определяет донора по JWT (private.auth_donor_id), идемпотентный upsert.
-- ============================================================================

create table push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  donor_id      uuid not null unique references donors (id) on delete cascade,
  subscription  jsonb not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table push_subscriptions is 'Web Push subscription донора (endpoint, ключи) — одна активная на донора';

-- ----------------------------------------------------------------------------
-- RPC: регистрация/обновление подписки авторизованного донора
-- ----------------------------------------------------------------------------

create or replace function public.register_push_subscription(
  p_subscription jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_donor_id uuid := private.auth_donor_id();
begin
  if v_donor_id is null then
    raise exception 'Требуется вход в систему: подписка доступна только авторизованным донорам'
      using errcode = 'P0001';
  end if;

  insert into public.push_subscriptions (donor_id, subscription)
  values (v_donor_id, p_subscription)
  on conflict (donor_id) do update
    set subscription = excluded.subscription,
        updated_at   = now();
end;
$$;

revoke execute on function public.register_push_subscription(jsonb) from public, anon;
grant execute on function public.register_push_subscription(jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- RLS: подписки видит только владелец; запись — через RPC
-- ----------------------------------------------------------------------------

alter table push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on push_subscriptions
  for select to authenticated
  using (donor_id = (select private.auth_donor_id()));

create policy "push_subscriptions_delete_own" on push_subscriptions
  for delete to authenticated
  using (donor_id = (select private.auth_donor_id()));