# ADR-001 — Architecture MVP v1 (Modular best‑of‑breed)

Status: Accepted
Date: 2026‑02‑07
Owner: Rôle B — Product Builder B (Ops & Delivery)

## Contexte
Nous devons livrer en 1 semaine un MVP Click & Collect fonctionnel: un client peut commander et payer en ligne; l'équipe voit les commandes. Exigences: rapidité, absence de dead-ends, paiement fiable, audit minimal, hébergement simple.

Contraintes:
- Déploiement rapide (Vercel), coût minimal, peu d'opérations.
- Auth et base relationnelle prêtes pour RLS/RBAC.
- Paiement standard (Checkout) avec idempotence par design.
- Automatisations versionnables, observables, et remplaçables.

## Décision
Architecture modulaire "best‑of‑breed":
- Front client (commande): Next.js sur Vercel (pages: accueil, panier, confirmation).
- Back‑office (lecture commandes): Retool ou Softr (S1 = lecture seule), branché à Supabase.
- Données + Auth: Supabase (Postgres + RLS).
- Paiement: Stripe Checkout + Webhook.
- Automatisations/Webhooks: n8n (orchestration unique S1).
- Observabilité de base: logs n8n, audit_log en DB, Stripe logs.

Raisons:
- Time‑to‑value maximal, SDKs matures, séparation claire et interchangeable.

## Alternatifs considérés
- Bubble intégré: UX rapide, mais dette de migration/RLS limitée → rejeté pour la suite multi‑tenant.
- Full custom Node: trop lent et plus d'ops pour S1 → rejeté.

## Conséquences
- + Vitesse, robustesse paiement, SQL scalable; – 2 UIs (client + back-office) et n8n à maintenir.

## Intégrations (ownership, échec, idempotence, contrat)
1) Stripe
   - Owner: Rôle B
   - Échecs: webhook 4xx/5xx, duplicata
   - Retries: Stripe relivre → endpoint idempotent
   - Idempotence: clé = payment_intent.id (upsert unique)
   - Contrat: Checkout create + Webhook (checkout.session.completed, payment_intent.succeeded)

2) Supabase
   - Owner: Rôle B
   - Échecs: FK/RLS/down
   - Retries: backoff n8n; file d'attente locale si down
   - Idempotence: upsert par clés uniques (stripe_payment_intent_id)
   - Contrat: REST/RPC/SQL

3) n8n
   - Owner: Rôle B
   - Échecs: workflow failed/timeout
   - Retries: activés + alerte
   - Idempotence: IF exists then skip, verrous logiques DB
   - Contrat: workflow stripe_checkout_webhook_v1 (input=event JSON → output=upserts + audit)

4) Retool/Softr (Back‑office S1)
   - Owner: Rôle B
   - Lecture seule
   - Contrat: vues/queries read‑only (orders/order_items/payments)

## Sécurité & conformité (S1)
- Secrets en vaults (Vercel/Supabase/Stripe/n8n); .env.example sans secrets.
- Minimisation PII (email client uniquement S1), pas de cartes en base.
- RLS: pas de lecture publique; back‑office restreint.
- Audit: table audit_log (CRUD + exécutions webhook).

## Observabilité & Ops (S1)
- Monitoring: erreurs n8n, dashboard Stripe, builds Vercel.
- Runbooks: relancer n8n, relivrer events Stripe depuis dashboard.

## Exit plan
- Admin Retool/Softr → Next.js admin.
- Stripe abstrait → autre PSP possible.
- n8n → serverless/Temporal si charge.
- Supabase → Postgres managé compatible SQL.