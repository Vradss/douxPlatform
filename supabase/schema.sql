-- ============================================================
-- ESQUEMA DE BASE DE DATOS - Corporación Doux Bebé
-- Ejecutar en el editor SQL de Supabase
-- ============================================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: perfiles de usuario (vinculada a auth.users)
-- ============================================================
create table public.perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null,
  rol text not null check (rol in ('admin', 'operaciones')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.perfiles is 'Perfiles de los 2 usuarios del sistema: Guido (admin) y Jeannys (operaciones)';

-- ============================================================
-- TABLA: clientes
-- ============================================================
create table public.clientes (
  id uuid primary key default uuid_generate_v4(),
  razon_social text not null,
  ruc text,
  telefono text,
  email text,
  direccion text,
  -- Saldo global: positivo = deuda del cliente, 0 = al día
  saldo_pendiente numeric(12, 2) not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.clientes.saldo_pendiente is 'Saldo acumulado del cliente. Sube con cada NP, baja con cobros.';

-- ============================================================
-- TABLA: productos
-- ============================================================
create table public.productos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  descripcion text,
  -- Precio CON IGV incluido (18%) — precio al cliente final
  precio_con_igv numeric(12, 2) not null,
  stock integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.productos.precio_con_igv is 'Precio de lista con IGV incluido. Es el precio que ve el cliente.';

-- ============================================================
-- TABLA: notas_pedido (NP)
-- ============================================================
create type estado_np as enum ('pendiente', 'cobrada', 'parcial', 'anulada');
create type tipo_comprobante as enum ('factura', 'boleta', 'ninguno');

create table public.notas_pedido (
  id uuid primary key default uuid_generate_v4(),
  -- Número correlativo: NP-0001, NP-0002, etc.
  numero text not null unique,
  cliente_id uuid not null references public.clientes(id),
  fecha date not null default current_date,
  -- Totales calculados (precios CON IGV)
  subtotal numeric(12, 2) not null default 0,   -- sin IGV (total / 1.18)
  igv numeric(12, 2) not null default 0,          -- IGV = total - subtotal
  total numeric(12, 2) not null default 0,        -- total con IGV
  estado estado_np not null default 'pendiente',
  -- Comprobante fiscal (opcional)
  tipo_comprobante tipo_comprobante not null default 'ninguno',
  numero_comprobante text,
  -- Notas adicionales
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TABLA: detalle_np (líneas de cada NP)
-- ============================================================
create table public.detalle_np (
  id uuid primary key default uuid_generate_v4(),
  np_id uuid not null references public.notas_pedido(id) on delete cascade,
  producto_id uuid references public.productos(id),
  -- Descripción manual (para productos que no están en catálogo)
  descripcion text not null,
  cantidad integer not null check (cantidad > 0),
  -- Precio unitario CON IGV
  precio_unitario numeric(12, 2) not null,
  -- subtotal = cantidad * precio_unitario (con IGV)
  subtotal numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLA: cobros (pagos parciales o totales de clientes)
-- ============================================================
create type metodo_pago as enum ('efectivo', 'transferencia', 'deposito', 'yape', 'plin', 'otro');

create table public.cobros (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null references public.clientes(id),
  fecha date not null default current_date,
  monto numeric(12, 2) not null check (monto > 0),
  metodo_pago metodo_pago not null default 'transferencia',
  referencia text,   -- número de operación, voucher, etc.
  observaciones text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Función para actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers de updated_at
create trigger set_updated_at_clientes
  before update on public.clientes
  for each row execute function public.set_updated_at();

create trigger set_updated_at_productos
  before update on public.productos
  for each row execute function public.set_updated_at();

create trigger set_updated_at_notas_pedido
  before update on public.notas_pedido
  for each row execute function public.set_updated_at();

-- ============================================================
-- FUNCIÓN: generar número correlativo de NP
-- ============================================================
create or replace function public.generar_numero_np()
returns text language plpgsql as $$
declare
  ultimo_numero integer;
  nuevo_numero text;
begin
  select coalesce(max(cast(split_part(numero, '-', 2) as integer)), 0)
  into ultimo_numero
  from public.notas_pedido
  where numero like 'NP-%';

  nuevo_numero := 'NP-' || lpad((ultimo_numero + 1)::text, 4, '0');
  return nuevo_numero;
end;
$$;

-- ============================================================
-- FUNCIÓN: actualizar saldo del cliente al crear/anular NP
-- ============================================================
create or replace function public.actualizar_saldo_por_np()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    -- Nueva NP: aumenta la deuda del cliente
    update public.clientes
    set saldo_pendiente = saldo_pendiente + new.total
    where id = new.cliente_id;

  elsif TG_OP = 'UPDATE' then
    if old.estado != 'anulada' and new.estado = 'anulada' then
      -- Se anuló la NP: restar el total de la deuda
      update public.clientes
      set saldo_pendiente = saldo_pendiente - new.total
      where id = new.cliente_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_actualizar_saldo_np
  after insert or update on public.notas_pedido
  for each row execute function public.actualizar_saldo_por_np();

-- ============================================================
-- FUNCIÓN: actualizar saldo del cliente al registrar cobro
-- ============================================================
create or replace function public.actualizar_saldo_por_cobro()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    -- Nuevo cobro: reduce la deuda del cliente
    update public.clientes
    set saldo_pendiente = saldo_pendiente - new.monto
    where id = new.cliente_id;

  elsif TG_OP = 'DELETE' then
    -- Se eliminó un cobro: restaurar la deuda
    update public.clientes
    set saldo_pendiente = saldo_pendiente + old.monto
    where id = old.cliente_id;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_actualizar_saldo_cobro
  after insert or delete on public.cobros
  for each row execute function public.actualizar_saldo_por_cobro();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.perfiles enable row level security;
alter table public.clientes enable row level security;
alter table public.productos enable row level security;
alter table public.notas_pedido enable row level security;
alter table public.detalle_np enable row level security;
alter table public.cobros enable row level security;

-- Políticas: solo usuarios autenticados pueden leer/escribir
-- (ambos roles tienen acceso completo a datos; las restricciones de rol
-- se manejan en la UI, no en la BD)

create policy "usuarios autenticados pueden leer clientes"
  on public.clientes for select
  to authenticated using (true);

create policy "usuarios autenticados pueden insertar clientes"
  on public.clientes for insert
  to authenticated with check (true);

create policy "usuarios autenticados pueden actualizar clientes"
  on public.clientes for update
  to authenticated using (true);

-- Productos
create policy "usuarios autenticados pueden leer productos"
  on public.productos for select
  to authenticated using (true);

create policy "solo admin puede insertar productos"
  on public.productos for insert
  to authenticated with check (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

create policy "solo admin puede actualizar productos"
  on public.productos for update
  to authenticated using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- Notas de pedido
create policy "usuarios autenticados pueden leer NPs"
  on public.notas_pedido for select
  to authenticated using (true);

create policy "usuarios autenticados pueden insertar NPs"
  on public.notas_pedido for insert
  to authenticated with check (true);

create policy "usuarios autenticados pueden actualizar NPs"
  on public.notas_pedido for update
  to authenticated using (true);

-- Detalle NP
create policy "usuarios autenticados pueden leer detalle NP"
  on public.detalle_np for select
  to authenticated using (true);

create policy "usuarios autenticados pueden insertar detalle NP"
  on public.detalle_np for insert
  to authenticated with check (true);

create policy "usuarios autenticados pueden actualizar detalle NP"
  on public.detalle_np for update
  to authenticated using (true);

create policy "usuarios autenticados pueden eliminar detalle NP"
  on public.detalle_np for delete
  to authenticated using (true);

-- Cobros
create policy "usuarios autenticados pueden leer cobros"
  on public.cobros for select
  to authenticated using (true);

create policy "usuarios autenticados pueden insertar cobros"
  on public.cobros for insert
  to authenticated with check (true);

-- Solo admin puede eliminar cobros
create policy "solo admin puede eliminar cobros"
  on public.cobros for delete
  to authenticated using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- Perfiles
create policy "usuarios pueden leer su propio perfil"
  on public.perfiles for select
  to authenticated using (true);

-- ============================================================
-- DATOS INICIALES (correr después del schema)
-- ============================================================

-- IMPORTANTE: Primero crear los usuarios en Supabase Auth Dashboard:
-- 1. guido@douxbebe.com (contraseña segura) → admin
-- 2. jeannys@douxbebe.com (contraseña segura) → operaciones
-- Luego insertar los perfiles con los IDs generados por Auth:

-- insert into public.perfiles (id, nombre, rol) values
--   ('<uuid-de-guido>', 'Guido', 'admin'),
--   ('<uuid-de-jeannys>', 'Jeannys', 'operaciones');
