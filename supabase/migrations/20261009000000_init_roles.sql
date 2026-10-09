-- Rico Store: perfis, papéis (admin / atendente / cliente) e newsletter.
-- O papel vive em public.profiles. Quem se cadastra é sempre "cliente":
-- só um administrador (ou o SQL Editor / service role) promove alguém.

create type public.app_role as enum ('admin', 'atendente', 'cliente');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role public.app_role not null default 'cliente',
  created_at timestamptz not null default now()
);

-- Papel de quem está logado. security definer evita recursão do RLS dentro das próprias políticas.
create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;

-- Todo usuário novo ganha um perfil de cliente. O papel NUNCA vem dos metadados do cadastro,
-- que o próprio usuário controla.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantém o e-mail do perfil igual ao da conta.
create function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- Trava de segurança: ninguém além de um administrador muda papel, e o e-mail só muda pela conta.
-- Sem auth.uid() (SQL Editor, service role) a trava não se aplica: é assim que nasce o 1º admin.
create function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'O id do perfil não pode mudar' using errcode = '42501';
  end if;
  if (select auth.uid()) is not null then
    if new.role is distinct from old.role and coalesce(public.current_app_role(), 'cliente') <> 'admin' then
      raise exception 'Apenas administradores mudam papéis' using errcode = '42501';
    end if;
    if new.email is distinct from old.email then
      raise exception 'O e-mail muda pela conta, não pelo perfil' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;

create policy "profiles: ler o próprio; a equipe lê todos"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.current_app_role()) in ('admin', 'atendente')
  );

create policy "profiles: editar o próprio"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: administrador edita todos"
  on public.profiles for update to authenticated
  using ((select public.current_app_role()) = 'admin')
  with check ((select public.current_app_role()) = 'admin');

-- ---------------------------------------------------------------------------
-- Newsletter do rodapé: qualquer visitante se inscreve; só a equipe lê.
-- ---------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
    check (email = lower(email) and length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "newsletter: qualquer visitante se inscreve"
  on public.newsletter_subscribers for insert to anon, authenticated
  with check (true);

create policy "newsletter: a equipe lê"
  on public.newsletter_subscribers for select to authenticated
  using ((select public.current_app_role()) in ('admin', 'atendente'));
