-- Migration 001b: Audit log for MVP (Week 1)
-- Date: 2026-02-07
-- Owner: Rôle B

-- Audit log table
create table if not exists audit_log (
  id bigserial primary key,
  event_type text not null,
  source text not null, -- 'stripe_webhook', 'api', 'backoffice', etc.
  entity_type text, -- 'order', 'payment', 'customer', etc.
  entity_id text,
  payload jsonb,
  user_id uuid,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_audit_log_event_type on audit_log(event_type);
create index idx_audit_log_source on audit_log(source);
create index idx_audit_log_entity on audit_log(entity_type, entity_id);
create index idx_audit_log_created_at on audit_log(created_at desc);

-- Trigger function to log changes
create or replace function log_entity_change()
returns trigger as $$
begin
  if (TG_OP = 'DELETE') then
    insert into audit_log (event_type, source, entity_type, entity_id, payload)
    values (TG_OP, 'database_trigger', TG_TABLE_NAME, old.id::text, row_to_json(old));
    return old;
  elsif (TG_OP = 'UPDATE') then
    insert into audit_log (event_type, source, entity_type, entity_id, payload)
    values (TG_OP, 'database_trigger', TG_TABLE_NAME, new.id::text, jsonb_build_object('old', row_to_json(old), 'new', row_to_json(new)));
    return new;
  elsif (TG_OP = 'INSERT') then
    insert into audit_log (event_type, source, entity_type, entity_id, payload)
    values (TG_OP, 'database_trigger', TG_TABLE_NAME, new.id::text, row_to_json(new));
    return new;
  end if;
  return null;
end;
$$ language plpgsql;

-- Apply audit triggers to critical tables
create trigger audit_orders after insert or update or delete on orders
  for each row execute function log_entity_change();

create trigger audit_payments after insert or update or delete on payments
  for each row execute function log_entity_change();

create trigger audit_customers after insert or update or delete on customers
  for each row execute function log_entity_change();

comment on table audit_log is 'Audit trail for all critical operations';