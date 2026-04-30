-- ============================================================
-- LIMPIEZA DE TABLAS DUPLICADAS - Corporación Doux Bebé
-- Elimina detalle_np y cobros (vacías) y apunta triggers a las
-- tablas correctas: notas_pedido_items y cobranzas
--
-- ⚠ VERIFICAR ANTES DE CORRER:
--   select count(*) from public.detalle_np;   -- debe ser 0
--   select count(*) from public.cobros;        -- debe ser 0
-- ============================================================

-- 1. Eliminar triggers que apuntan a las tablas a borrar
drop trigger if exists trg_actualizar_saldo_cobro on public.cobros;

-- 2. Eliminar tablas duplicadas (vacías)
drop table if exists public.detalle_np cascade;
drop table if exists public.cobros cascade;

-- 3. Recrear el trigger de saldo sobre la tabla correcta: cobranzas
--    ⚠ Ajusta los nombres de columna si difieren en tu tabla cobranzas
create trigger trg_actualizar_saldo_cobranza
  after insert or delete on public.cobranzas
  for each row execute function public.actualizar_saldo_por_cobro();

-- 4. Verificar que las RLS estén activas en las tablas que permanecen
alter table public.notas_pedido_items enable row level security;
alter table public.cobranzas enable row level security;

-- 5. Políticas RLS para notas_pedido_items (si no existen)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'notas_pedido_items' and policyname = 'auth leer items'
  ) then
    execute $p$
      create policy "auth leer items"
        on public.notas_pedido_items for select
        to authenticated using (true);
    $p$;
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'notas_pedido_items' and policyname = 'auth insertar items'
  ) then
    execute $p$
      create policy "auth insertar items"
        on public.notas_pedido_items for insert
        to authenticated with check (true);
    $p$;
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'notas_pedido_items' and policyname = 'auth eliminar items'
  ) then
    execute $p$
      create policy "auth eliminar items"
        on public.notas_pedido_items for delete
        to authenticated using (true);
    $p$;
  end if;
end $$;

-- 6. Políticas RLS para cobranzas (si no existen)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cobranzas' and policyname = 'auth leer cobranzas'
  ) then
    execute $p$
      create policy "auth leer cobranzas"
        on public.cobranzas for select
        to authenticated using (true);
    $p$;
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'cobranzas' and policyname = 'auth insertar cobranzas'
  ) then
    execute $p$
      create policy "auth insertar cobranzas"
        on public.cobranzas for insert
        to authenticated with check (true);
    $p$;
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'cobranzas' and policyname = 'auth eliminar cobranzas'
  ) then
    execute $p$
      create policy "auth eliminar cobranzas"
        on public.cobranzas for delete
        to authenticated using (
          exists (
            select 1 from public.perfiles
            where id = auth.uid() and rol = 'admin'
          )
        );
    $p$;
  end if;
end $$;

-- ============================================================
-- VERIFICACIÓN FINAL — estas queries deben funcionar sin error:
-- select * from public.notas_pedido_items limit 1;
-- select * from public.cobranzas limit 1;
-- ============================================================
