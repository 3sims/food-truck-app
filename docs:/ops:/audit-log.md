# Audit Log — Semaine 1

## Objectif
Tracer toutes les opérations critiques pour débug, conformité, et replay.

## Table
`audit_log` (voir schema/migrations/001b_audit.sql)

Colonnes:
- `id`: bigserial (auto-increment)
- `event_type`: INSERT / UPDATE / DELETE / WEBHOOK / API_CALL
- `source`: stripe_webhook, database_trigger, api, backoffice
- `entity_type`: order, payment, customer
- `entity_id`: UUID de l'entité concernée
- `payload`: JSON complet (avant/après si UPDATE)
- `user_id`: nullable (si action utilisateur authentifié)
- `ip_address`: nullable
- `created_at`: timestamptz

## Événements tracés (S1)

### Automatiquement (triggers DB)
- CREATE/UPDATE/DELETE sur `orders`
- CREATE/UPDATE/DELETE sur `payments`
- CREATE/UPDATE/DELETE sur `customers`

### Manuellement (via n8n ou API)
- Réception webhook Stripe
- Appel API création de commande
- Accès back-office (S2+)

## Requêtes utiles

### Derniers événements
```sql
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50;