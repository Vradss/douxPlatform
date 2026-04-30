-- ============================================================
-- RESET - Corporación Doux Bebé
-- Corre este script PRIMERO para limpiar el schema anterior
-- Luego corre schema.sql
-- ============================================================

-- Eliminar triggers primero
drop trigger if exists set_updated_at_clientes on public.clientes;
drop trigger if exists set_updated_at_productos on public.productos;
drop trigger if exists set_updated_at_notas_pedido on public.notas_pedido;
drop trigger if exists trg_actualizar_saldo_np on public.notas_pedido;
drop trigger if exists trg_actualizar_saldo_cobro on public.cobros;

-- Eliminar tablas (CASCADE elimina dependencias)
drop table if exists public.detalle_np cascade;
drop table if exists public.cobros cascade;
drop table if exists public.notas_pedido cascade;
drop table if exists public.productos cascade;
drop table if exists public.clientes cascade;
drop table if exists public.perfiles cascade;

-- Eliminar tipos personalizados
drop type if exists estado_np cascade;
drop type if exists tipo_comprobante cascade;
drop type if exists metodo_pago cascade;

-- Eliminar funciones
drop function if exists public.set_updated_at() cascade;
drop function if exists public.generar_numero_np() cascade;
drop function if exists public.actualizar_saldo_por_np() cascade;
drop function if exists public.actualizar_saldo_por_cobro() cascade;
