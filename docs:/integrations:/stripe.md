# Intégration Stripe — Semaine 1

## Configuration

### Clés API
- Mode test: clés commençant par `pk_test_` et `sk_test_`
- Mode prod: clés commençant par `pk_live_` et `sk_live_`
- Variables d'environnement:
  - `STRIPE_PUBLIC_KEY` (front)
  - `STRIPE_SECRET_KEY` (back/n8n)
  - `STRIPE_WEBHOOK_SECRET` (n8n)

### Création d'une Checkout Session
Endpoint: `POST /api/orders/create-checkout-session`

Paramètres:
- `items`: tableau d'objets `{menu_item_id, qty}`
- `customer_email`: email du client
- `success_url`: URL de retour après paiement réussi
- `cancel_url`: URL de retour si annulation

Flux:
1. Calcul serveur du montant total (prix × qty)
2. Création session Checkout Stripe
3. Retour de l'URL de paiement
4. Redirection client vers Stripe

### Webhook Events
Endpoint n8n: configuré dans Stripe Dashboard → Webhooks

Événements écoutés (S1):
- `checkout.session.completed`: session validée
- `payment_intent.succeeded`: paiement réussi
- `payment_intent.payment_failed`: paiement échoué

### Idempotence
Clé unique: `stripe_payment_intent_id`
- Upsert en DB (table `payments`)
- Pas de double traitement même si Stripe relivre

### Sécurité
- Signature webhook vérifiée (signing secret)
- Secrets stockés dans vault Vercel/n8n
- Pas de clés en clair dans le code

### Tests
Mode test Stripe:
- Cartes de test: `4242 4242 4242 4242` (succès), `4000 0000 0000 0002` (échec)
- Événements de test envoyables depuis le Dashboard Stripe

### Retry & Error Handling
- Stripe retente les webhooks en cas de 5xx (backoff exponentiel)
- n8n doit répondre 200 OK même si déjà traité (idempotence)
- Logs Stripe: Dashboard → Developers → Webhooks → logs

### Rollback
- Si problème webhook: relire les événements manqués depuis le Dashboard
- Si refund nécessaire: API Stripe Refunds (pas dans MVP S1)