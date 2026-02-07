-- Migration 001: Initial schema for MVP Click & Collect (Week 1)
-- Date: 2026-02-07
-- Owner: Rôle B

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Customers table
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  phone text,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customers_email on customers(email);

-- Menu items table
create table if not exists menu_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price integer not null check (price >= 0), -- in cents
  currency text not null default 'eur',
  category text,
  available boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_menu_items_available on menu_items(available);
create index idx_menu_items_category on menu_items(category);

-- Orders table
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete set null,
  correlation_id text unique, -- checkout_session.id or payment_intent.id
  status text not null default 'pending' check (status in ('pending','paid','preparing','ready','completed','cancelled')),
  total_amount integer not null default 0 check (total_amount >= 0),
  currency text not null default 'eur',
  customer_email text not null,
  customer_phone text,
  pickup_time timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_status on orders(status);
create index idx_orders_customer_id on orders(customer_id);
create index idx_orders_correlation_id on orders(correlation_id);
create index idx_orders_created_at on orders(created_at desc);

-- Order items table
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  menu_item_name text not null, -- snapshot at order time
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  total_price integer not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

create index idx_order_items_order_id on order_items(order_id);
create index idx_order_items_menu_item_id on order_items(menu_item_id);

-- Payments table
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete set null,
  provider text not null default 'stripe',
  stripe_payment_intent_id text unique not null,
  amount integer not null check (amount >= 0),
  currency text not null default 'eur',
  status text not null check (status in ('pending','succeeded','failed','refunded')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_payments_stripe_pi on payments(stripe_payment_intent_id);
create index idx_payments_order_id on payments(order_id);
create index idx_payments_status on payments(status);

-- Trigger to update updated_at columns
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_customers_updated_at before update on customers
  for each row execute function update_updated_at_column();

create trigger set_menu_items_updated_at before update on menu_items
  for each row execute function update_updated_at_column();

create trigger set_orders_updated_at before update on orders
  for each row execute function update_updated_at_column();

create trigger set_payments_updated_at before update on payments
  for each row execute function update_updated_at_column();

-- Comments
comment on table customers is 'Customers who place orders';
comment on table menu_items is 'Available menu items for purchase';
comment on table orders is 'Customer orders (Click & Collect)';
comment on table order_items is 'Line items within each order';
comment on table payments is 'Payment records from Stripe';