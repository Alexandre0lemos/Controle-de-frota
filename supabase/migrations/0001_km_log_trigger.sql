-- Migration: Adicionar trigger de log de quilometragem
-- Arquivo: supabase/migrations/0001_km_log_trigger.sql

create or replace function public.log_vehicle_km_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Apenas insere se o KM realmente mudou
  if (old.km_atual is distinct from new.km_atual) then
    insert into public.km_log (
      vehicle_id,
      km_anterior,
      km_atual,
      data,
      usuario,
      origem
    ) values (
      new.id,
      old.km_atual,
      new.km_atual,
      current_date,
      auth.uid(),
      'Sistema - Atualização Veículo'
    );
  end if;
  return new;
end;
$$;

create trigger tr_log_vehicle_km
after update on public.vehicles
for each row
execute function public.log_vehicle_km_change();
