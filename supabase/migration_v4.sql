-- ============================================================
-- MIGRACIÓN v4 — Nuevos campos de cliente
-- ============================================================

-- 1. Agregar columnas nuevas
alter table public.clientes
  add column if not exists tipo_doc text not null default 'RUC',
  add column if not exists num_doc text,
  add column if not exists celular text,
  add column if not exists perfil_pago text,
  add column if not exists comportamiento_pago text,
  add column if not exists tipo_venta text not null default 'contado'
    check (tipo_venta in ('contado', 'credito')),
  add column if not exists como_se_cobra text;

-- 2. Migrar datos existentes si los hay
update public.clientes
  set num_doc = ruc, tipo_doc = 'RUC'
  where ruc is not null and num_doc is null;

update public.clientes
  set celular = telefono
  where telefono is not null and celular is null;

-- 3. Actualizar vista para incluir los nuevos campos
drop view if exists public.v_saldo_clientes;
create view public.v_saldo_clientes as
select
  c.id,
  c.razon_social,
  c.nombre_whatsapp,
  c.tipo_doc,
  c.num_doc,
  c.ruc,
  c.telefono,
  c.celular,
  c.email,
  c.direccion,
  c.deuda_inicial,
  c.activo,
  c.perfil_pago,
  c.comportamiento_pago,
  c.tipo_venta,
  c.como_se_cobra,
  c.created_at,
  c.updated_at,
  round(
    coalesce(c.deuda_inicial, 0)
    + coalesce(np_totals.total_nps, 0)
    - coalesce(cob_totals.total_cobrado, 0),
    2
  ) as saldo_pendiente
from public.clientes c
left join (
  select cliente_id, sum(total) as total_nps
  from public.notas_pedido
  where estado != 'anulada'
  group by cliente_id
) np_totals on np_totals.cliente_id = c.id
left join (
  select cliente_id, sum(monto_cobrado) as total_cobrado
  from public.cobranzas
  group by cliente_id
) cob_totals on cob_totals.cliente_id = c.id;

alter view public.v_saldo_clientes set (security_invoker = true);

-- ============================================================
-- VERIFICACIÓN:
--   select id, razon_social, tipo_doc, num_doc, saldo_pendiente from v_saldo_clientes limit 5;
-- ============================================================
