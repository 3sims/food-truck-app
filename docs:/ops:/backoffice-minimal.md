# Back-office minimal — Semaine 1

## Objectif
Lecture seule des commandes du jour pour l'équipe food truck.

## Outil choisi
**Option A: Retool** (ou **Option B: Softr**)

## Configuration

### Connexion à Supabase
- Type: PostgreSQL
- Host: `db.xxxxx.supabase.co`
- Port: 5432
- Database: `postgres`
- User: `postgres`
- Password: (service role ou user dédié)

### Requête principale (commandes du jour)
```sql
SELECT 
  o.id,
  o.customer_email,
  o.status,
  o.total_amount / 100.0 as total_eur,
  o.created_at,
  o.pickup_time,
  array_agg(
    json_build_object(
      'name', oi.menu_item_name,
      'qty', oi.quantity,
      'price', oi.unit_price / 100.0
    )
  ) as items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status IN ('paid', 'preparing', 'ready')
  AND o.created_at >= current_date
GROUP BY o.id
ORDER BY o.created_at DESC;