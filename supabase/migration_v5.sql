-- ============================================================
-- MIGRACIÓN v5 — Exponer total_vendido y total_cobrado en la vista
-- ============================================================

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
  coalesce(np_totals.total_nps, 0)         as total_vendido,
  coalesce(cob_totals.total_cobrado, 0)    as total_cobrado,
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
