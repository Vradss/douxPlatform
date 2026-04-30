-- ============================================================
-- MIGRACIÓN v3 — Saldo calculado en código, sin triggers
-- ============================================================

-- 1. Agregar deuda_inicial a clientes (saldo pre-sistema desde Excel)
alter table public.clientes
  add column if not exists deuda_inicial numeric(12, 2) not null default 0;

comment on column public.clientes.deuda_inicial is
  'Saldo previo al sistema (importado de Excel). Parte del cálculo: saldo = deuda_inicial + SUM(NPs) - SUM(cobranzas)';

-- 2. Vista de saldo calculado dinámicamente
--    saldo = deuda_inicial + SUM(notas_pedido.total excl. anuladas) - SUM(cobranzas.monto_cobrado)
create or replace view public.v_saldo_clientes as
select
  c.id,
  c.razon_social,
  c.nombre_whatsapp,
  c.ruc,
  c.telefono,
  c.email,
  c.direccion,
  c.deuda_inicial,
  c.activo,
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

-- RLS en la vista (hereda de las tablas, pero por si acaso)
-- Las vistas en Supabase se pueden proteger con security_invoker
alter view public.v_saldo_clientes set (security_invoker = true);

-- ============================================================
-- VERIFICACIÓN:
--   select id, razon_social, saldo_pendiente from v_saldo_clientes limit 5;
-- ============================================================
