# Food Truck App — MVP Click & Collect

Application de commande en ligne **Click & Collect** pour food truck. Le client commande et paie en ligne, l'équipe food truck voit les commandes en temps réel.

> **Statut** : Semaine 1 — Infrastructure backend livrée (DB, webhooks, audit, docs).
> **Owner** : Rôle B — Product Builder (Ops & Delivery)

---

## Architecture

Architecture modulaire **best-of-breed** (cf. [ADR-001](docs:/architecture:/decisions.md)) :

| Couche | Service | Rôle |
|--------|---------|------|
| Frontend client | **Next.js** sur Vercel | Pages : accueil, menu, panier, confirmation |
| Base de données | **Supabase** (PostgreSQL) | Données + Auth + RLS |
| Paiement | **Stripe** Checkout | Création de session + webhooks |
| Orchestration | **n8n** | Réception webhook → upsert DB → audit |
| Back-office | **Retool** ou **Softr** | Lecture seule des commandes du jour |

### Flux complet (15 étapes)

```
Client ──1. Browse Menu──▶ Next.js
Client ──2. Create Order──▶ Next.js
Next.js ──3. POST /api/orders──▶ Supabase ──4. Insert──▶ orders
Next.js ──5. Create PaymentIntent (metadata: order_id)──▶ Stripe
Stripe  ──6. Return clientSecret──▶ Next.js ──7. Display──▶ Stripe Elements
Client  ──8. Confirm Payment──▶ Stripe
Stripe  ──9. Webhook payment_intent.succeeded──▶ n8n
n8n     ──10. Normalize──▶ 11. Upsert payments ──▶ 12. Insert audit_log
n8n     ──13. Update orders.status = 'paid'──▶ Supabase
Supabase──14. Status Update──▶ Next.js ──15. Display Success──▶ Client
```

Diagramme Mermaid complet : [mvp-v1_architecture.mmd](docs:/architecture:/mvp-v1_architecture.mmd) | [PNG](docs:/architecture:/mvp-v1_architecture.png)

---

## Structure du projet

```
food-truck-app/
├── app:/                               # Code Next.js (Semaine 2)
├── automation:/
│   └── n8n:/
│       └── stripe_checkout_webhook_v1.json   # Workflow n8n (7 noeuds)
├── docs:/
│   ├── architecture:/
│   │   ├── decisions.md                # ADR-001 : choix best-of-breed
│   │   ├── contracts.md                # Contrats d'intégration (3 flux)
│   │   ├── mvp-v1_architecture.mmd     # Schéma Mermaid
│   │   └── README.md                   # Index architecture
│   ├── integrations:/
│   │   └── stripe.md                   # Config Stripe, webhooks, idempotence
│   ├── ops:/
│   │   ├── deploy-staging.md           # Déploiement Vercel staging
│   │   ├── backoffice-minimal.md       # Config Retool/Softr
│   │   └── audit-log.md               # Audit trail & requêtes utiles
│   ├── schema:/
│   │   └── erd-v1.mmd                 # ERD Mermaid (5 tables + relations)
│   ├── Livrables-semaines/             # Livrables hebdomadaires
│   ├── security:/                      # Sécurité (à compléter)
│   ├── tests:/                         # Tests (à compléter)
│   └── data:/                          # Données (à compléter)
├── schema:/
│   ├── migrations:/
│   │   ├── 001_init.sql               # 5 tables + indexes + triggers
│   │   └── 001b_audit.sql             # audit_log + triggers automatiques
│   └── snapshots:/                     # Snapshots DB (à compléter)
├── vercel:/                            # Config Vercel (à compléter)
├── .env.example                        # 7 variables d'environnement
└── README.md
```

---

## Base de données

6 tables PostgreSQL sur Supabase (cf. [ERD](docs:/schema:/erd-v1.mmd)) :

| Table | Description | Clé unique |
|-------|-------------|------------|
| `customers` | Clients (email, nom, téléphone) | `email` |
| `menu_items` | Carte du food truck (nom, prix en centimes, catégorie, dispo) | `id` |
| `orders` | Commandes (statut, montant, pickup_time, notes) | `correlation_id` (= checkout_session.id) |
| `order_items` | Lignes de commande (snapshot nom + prix au moment de la commande) | `id` |
| `payments` | Paiements Stripe (montant, statut, metadata JSONB) | `stripe_payment_intent_id` |
| `audit_log` | Traçabilité (event_type, source, entity, payload JSON) | `id` (bigserial) |

**Statuts d'une commande** : `pending` → `paid` → `preparing` → `ready` → `completed` | `cancelled`

**Statuts d'un paiement** : `pending` → `succeeded` | `failed` | `refunded`

**Triggers automatiques** :
- `updated_at` mis à jour sur chaque UPDATE (customers, menu_items, orders, payments)
- `audit_log` alimenté automatiquement sur INSERT/UPDATE/DELETE (orders, payments, customers)

---

## Workflow n8n — `stripe_checkout_webhook_v1`

Pipeline en 7 noeuds :

```
Stripe Trigger → normalize_event → upsert_payment_supabase → merge_payment_and_event
                                                                      ↓
                 update_order_status_paid ← IF payment succeeded? ← insert_audit_log
```

**Événements écoutés** : `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.payment_succeeded`, `invoice.payment_failed`

**Idempotence** : Upsert sur `stripe_payment_intent_id` (pas de double traitement si Stripe relivre).

**Normalisation** (noeud Code) : Extrait `paymentIntentId`, `amount`, `currency`, `email`, `status` depuis n'importe quel type d'événement Stripe.

---

## Contrats d'intégration

### 1. Frontend → Stripe (Checkout Session)

```
POST /api/orders/create-checkout-session
```

**Request** :
```json
{
  "items": [{ "menu_item_id": "uuid", "qty": 2 }],
  "customer_email": "client@example.com",
  "success_url": "https://app.example.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://app.example.com/cancel"
}
```

**Response** :
```json
{ "checkout_url": "https://checkout.stripe.com/c/session_xyz" }
```

Prix calculés **côté serveur** (pas de trust UI).

### 2. Stripe → n8n (Webhook)

Endpoint : URL publique du noeud Stripe Trigger n8n.
Signature vérifiée via `STRIPE_WEBHOOK_SECRET`.
Traitement : upsert `payments` → insert `audit_log` → update `orders.status`.

### 3. Back-office → Supabase (lecture seule)

Connexion PostgreSQL directe depuis Retool/Softr.
Requête : commandes du jour avec statut `paid`/`preparing`/`ready` + détail des items (cf. [backoffice-minimal.md](docs:/ops:/backoffice-minimal.md)).

---

## Démarrage rapide

### Prérequis

- Compte **Supabase** (gratuit)
- Compte **Stripe** (mode test)
- **n8n** Cloud ou auto-hébergé
- Node.js 18+ (pour le frontend Semaine 2)

### 1. Base de données

```sql
-- Dans Supabase SQL Editor, exécuter dans l'ordre :
-- 1) schema:/migrations:/001_init.sql    (5 tables, indexes, triggers updated_at)
-- 2) schema:/migrations:/001b_audit.sql  (audit_log, triggers d'audit)
```

### 2. Stripe

1. Récupérer `pk_test_*` et `sk_test_*` depuis Developers → API keys
2. Créer un webhook endpoint → URL n8n
3. Souscrire : `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copier le `whsec_*` (signing secret)

### 3. n8n

1. Importer `automation:/n8n:/stripe_checkout_webhook_v1.json`
2. Configurer les credentials :
   - **Stripe** : clé secrète `sk_test_*`
   - **Supabase** (HTTP Headers Auth) : `apikey` + `Authorization: Bearer <service_role_key>`
3. Activer le workflow → copier l'URL du webhook

### 4. Variables d'environnement

```bash
cp .env.example .env.local
```

```bash
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE=eyJxxx...
APP_BASE_URL=http://localhost:3000
CURRENCY=eur
N8N_WEBHOOK_URL_STRIPE=https://xxxxx.app.n8n.cloud/webhook/stripe
```

### 5. Back-office

Connecter Retool ou Softr à Supabase en PostgreSQL (cf. [backoffice-minimal.md](docs:/ops:/backoffice-minimal.md)).

---

## Tests

### Cartes de test Stripe

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Paiement refusé |

Expiration : toute date future. CVC : 3 chiffres quelconques.

### Scénario e2e complet

1. Créer une Checkout Session Stripe (via API ou dashboard)
2. Payer avec carte de test
3. Vérifier dans **n8n** : Executions → le workflow s'est déclenché
4. Vérifier dans **Supabase** :
   - `payments` : ligne avec `status = 'succeeded'`
   - `orders` : commande passée en `status = 'paid'`
   - `audit_log` : événement tracé avec payload complet
5. Vérifier dans le **back-office** : commande visible dans la liste du jour

---

## Sécurité

- **Secrets** : Stockés dans vaults (Vercel, Supabase, n8n). `.env.example` sans secrets
- **PII** : Email client uniquement (S1), aucune donnée carte en DB (Stripe gère)
- **RLS** : Activé sur Supabase, pas de lecture publique
- **Webhooks** : Signature Stripe vérifiée systématiquement (signing secret)
- **Audit** : Tous les INSERT/UPDATE/DELETE tracés automatiquement via triggers
- **Idempotence** : Upsert par `stripe_payment_intent_id` (pas de double traitement)

---

## Monitoring & Ops

| Service | Dashboard | Actions |
|---------|-----------|---------|
| **n8n** | Executions | Voir erreurs, relancer un workflow |
| **Stripe** | Developers → Events/Webhooks | Relivrer un événement manqué |
| **Vercel** | Logs | Débug runtime et déploiements |
| **Supabase** | Logs, Table Editor | Requêtes SQL, vérifier données |

**Rollback** : Vercel → Deployments → "Promote to Production" sur version précédente.

---

## Documentation complète

| Document | Contenu |
|----------|---------|
| [decisions.md](docs:/architecture:/decisions.md) | ADR-001 : Choix architecture modulaire, alternatives rejetées, exit plan |
| [contracts.md](docs:/architecture:/contracts.md) | 3 contrats d'intégration (Frontend→Stripe, Stripe→n8n, Backoffice→Supabase) |
| [stripe.md](docs:/integrations:/stripe.md) | Config Stripe, webhooks, idempotence, retry, rollback |
| [deploy-staging.md](docs:/ops:/deploy-staging.md) | Déploiement Vercel, variables, protection, tests post-deploy |
| [backoffice-minimal.md](docs:/ops:/backoffice-minimal.md) | Config Retool/Softr, requête SQL commandes du jour |
| [audit-log.md](docs:/ops:/audit-log.md) | Structure audit_log, événements tracés, requêtes utiles |
| [erd-v1.mmd](docs:/schema:/erd-v1.mmd) | Diagramme entité-relation (5 tables + relations) |

---

## Roadmap

### Semaine 1 — Infrastructure backend (livré)

- [x] ADR-001 : Architecture modulaire best-of-breed
- [x] Schéma DB : 5 tables + audit_log + triggers + indexes
- [x] Workflow n8n : `stripe_checkout_webhook_v1` (7 noeuds)
- [x] Contrats d'intégration (3 flux documentés)
- [x] Guide Stripe (config, webhooks, idempotence, tests)
- [x] Guide déploiement staging Vercel
- [x] Guide back-office minimal (Retool/Softr)
- [x] ERD Mermaid + diagramme d'architecture

### Semaine 2 — Frontend & API

- [ ] Frontend Next.js (pages : accueil, menu, panier, checkout, confirmation)
- [ ] API Route `POST /api/orders/create-checkout-session`
- [ ] Intégration Stripe Elements (formulaire de paiement)
- [ ] Corrélation commande ↔ paiement (`correlation_id`)
- [ ] Déploiement staging Vercel
- [ ] Tests e2e du flux complet

### Semaine 3+ — Production & évolutions

- [ ] Domaine custom + Stripe live mode
- [ ] Back-office Next.js (remplacement Retool/Softr)
- [ ] Multi-tenant (RLS policies Supabase)
- [ ] Notifications client (email/SMS confirmation commande)
- [ ] Analytics et métriques

---

### Exit plan

Chaque composant est remplaçable indépendamment :
- Retool/Softr → Next.js admin
- Stripe → autre PSP (abstraction existante)
- n8n → serverless functions / Temporal
- Supabase → tout PostgreSQL managé (SQL standard)
