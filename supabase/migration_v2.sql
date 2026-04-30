-- ============================================================
-- MIGRACIÓN v2 - Corporación Doux Bebé
-- Ejecutar en el editor SQL de Supabase (después del schema inicial)
-- ============================================================

-- 1. Agregar nombre_whatsapp a clientes (como aparece en el celular)
alter table public.clientes
  add column if not exists nombre_whatsapp text;

-- 2. Agregar código de producto (ej: DB-788W)
alter table public.productos
  add column if not exists codigo text;

create index if not exists idx_productos_codigo on public.productos(codigo);

-- 3. Nuevos campos en notas_pedido
alter table public.notas_pedido
  add column if not exists numero_proforma text,
  add column if not exists tipo_venta text not null default 'contado'
    check (tipo_venta in ('contado', 'credito')),
  add column if not exists comentario text;

-- 4. Agregar estado 'entregado' al enum estado_np
do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'entregado'
    and enumtypid = 'estado_np'::regtype
  ) then
    alter type estado_np add value 'entregado';
  end if;
end $$;

-- 5. (detalle_np eliminada — se usa notas_pedido_items)

-- 6. Actualizar generar_numero_np al formato N001-XXX
create or replace function public.generar_numero_np()
returns text language plpgsql as $$
declare
  ultimo_numero integer;
  nuevo_numero text;
begin
  -- Tomar el máximo correlativo del formato N001-XXX
  select coalesce(
    max(cast(split_part(numero, '-', 2) as integer)),
    249  -- Primer número será N001-250 si no hay NPs previas
  )
  into ultimo_numero
  from public.notas_pedido
  where numero like 'N001-%'
    and split_part(numero, '-', 2) ~ '^\d+$';

  nuevo_numero := 'N001-' || (ultimo_numero + 1)::text;
  return nuevo_numero;
end;
$$;
