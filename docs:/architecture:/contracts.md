# Contrats d'intégration — MVP v1 (Semaine 1)

## 1) Frontend → Stripe (Checkout Session)
- Endpoint: POST /api/orders/create-checkout-session
- Input (JSON):
  {
    "items": [{"menu_item_id":"uuid","qty":2}],
    "customer_email": "client@example.com",
    "success_url": "https://app.example.com/success?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "https://app.example.com/cancel"
  }
- Output (JSON):
  { "checkout_url": "https://checkout.stripe.com/c/session_xyz" }
- Règles:
  - Prix calculés côté serveur (pas de trust UI)
  - Montant total = somme(items.qty × prix) + taxes
  - Option: créer un "pending order" avec correlation_id = checkout_session.id

## 2) Stripe → n8n (Webhook)
- Endpoint n8n: URL publique générée par le nœud Stripe Trigger (ou Webhook) dans n8n
- Événements S1:
  - checkout.session.completed
  - payment_intent.succeeded
  - payment_intent.payment_failed
- Idempotence: clé = payment_intent.id (unique en DB)
- Traitement workflow (stripe_checkout_webhook_v1):
  1. Vérifier la signature Stripe (signing secret).
  2. Extraire payment_intent.id, amount, currency, email.
  3. Upsert payments (status: succeeded|failed, provider="stripe").
  4. Upsert orders (status: paid si succeeded).
  5. Écrire audit_log (event_type, payload_hash).

## 3) Back‑office (Retool/Softr) → Supabase
- Lecture seule S1: liste des commandes payées du jour.
- Auth: service user ou rôle "opérateur" avec policies.

## Variables d'environnement (référentiel S1)
- STRIPE_PUBLIC_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE
- APP_BASE_URL
- CURRENCY (ex. EUR)