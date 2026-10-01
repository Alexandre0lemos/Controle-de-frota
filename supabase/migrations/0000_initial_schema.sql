-- Supra Frota — schema inicial. Rode no SQL Editor do Supabase.
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  role text not null default 'consulta' check (role in ('admin','gestor','motorista','consulta')),
  created_at timestamptz default now()
);
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome) values (new.id, coalesce(new.raw_user_meta_data->>'nome',''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() $$;

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  nome text not null, cnh text, validade_cnh date, telefone text,
  status text default 'Ativo', created_at timestamptz default now()
);
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique, placa text not null unique,
  marca text, modelo text, versao text, ano int, tipo text default 'Utilitário de carga',
  carroceria text default 'Baú', combustivel text default 'Diesel',
  km_atual int default 0, motorista_id uuid references public.drivers(id) on delete set null,
  setor text default 'Logística', status text default 'Disponível',
  data_aquisicao date, observacoes text, created_at timestamptz default now()
);
create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  nome text not null, cnpj text, contato text, especialidade text,
  prazo_medio int, valor_medio numeric(12,2), garantia text
);
create table public.maintenance (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  motorista_id uuid references public.drivers(id) on delete set null,
  tipo text, status text default 'Em manutenção', oficina text,
  data_entrada date, data_prevista date, data_conclusao date, km int,
  problema text, diagnostico text, servicos text,
  pecas numeric(12,2) default 0, mao_obra numeric(12,2) default 0, outros numeric(12,2) default 0,
  garantia text, observacoes text, created_at timestamptz default now()
);
create table public.oil_changes (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  tipo_oleo text, marca text, litros numeric, filtro text, data date, km int,
  periodicidade_km int, periodicidade_meses int, oficina text, custo numeric(12,2) default 0, observacoes text
);
create table public.preventive (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  servico text not null, periodicidade_km int, periodicidade_meses int,
  ultima_execucao_data date, ultima_execucao_km int, prioridade text default 'Média', responsavel text
);
create table public.km_log (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  km_anterior int, km_atual int, data date default current_date, usuario text, origem text
);
create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  motorista_id uuid references public.drivers(id) on delete set null,
  tipo text, data date, hora text, km int, itens jsonb default '[]', situacao text, observacoes text
);
create table public.refuels (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  motorista_id uuid references public.drivers(id) on delete set null,
  data date, posto text, combustivel text, litros numeric, valor numeric(12,2), km int
);
create table public.tires (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  marca text, modelo text, medida text, posicao text, data_instalacao date, km_instalacao int,
  valor numeric(12,2), data_retirada date, km_retirada int, motivo text
);
create table public.damages (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  motorista_id uuid references public.drivers(id) on delete set null,
  data date, tipo text, descricao text, classificacao text default 'Leve',
  responsavel text, prazo date, status text default 'Aberta', custo numeric(12,2) default 0
);
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  tipo text, numero text, data_vencimento date, custo numeric(12,2) default 0, observacoes text
);
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), user_id uuid default auth.uid(),
  usuario text, acao text, detalhe text
);

-- RLS: leitura para autenticados; escrita por perfil.
do $$ declare t text; begin
  foreach t in array array['drivers','vehicles','workshops','maintenance','oil_changes','preventive','km_log','checklists','refuels','tires','damages','documents','audit_log','profiles']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "read_%1$s" on public.%1$I for select to authenticated using (true)', t);
  end loop;
  foreach t in array array['drivers','vehicles','workshops','maintenance','oil_changes','preventive','tires','damages','documents']
  loop
    execute format($f$create policy "write_%1$s" on public.%1$I for all to authenticated
      using (public.my_role() in ('admin','gestor')) with check (public.my_role() in ('admin','gestor'))$f$, t);
  end loop;
  foreach t in array array['km_log','checklists','refuels','audit_log']
  loop
    execute format($f$create policy "write_%1$s" on public.%1$I for insert to authenticated
      with check (public.my_role() in ('admin','gestor','motorista'))$f$, t);
  end loop;
end $$;
create policy "profiles_admin_update" on public.profiles for update to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
-- Para tornar o primeiro usuário admin:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'SEU@EMAIL');
