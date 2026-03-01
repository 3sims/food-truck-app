# Food Truck App — Click & Collect

Application web de commande en ligne pour food truck. Le client consulte la carte, passe commande et paie en ligne — il choisit un créneau et vient chercher son repas directement au camion. L'équipe voit les commandes en temps réel sur un tableau de bord.

---

## Statut actuel du projet

| Module | État | Remarques |
|--------|------|-----------|
| Menu, panier, commande client | ✅ Livré | Fonctionnel en production |
| Paiement Stripe + confirmation | ✅ Livré | Flux complet opérationnel |
| Géolocalisation food trucks | ✅ Livré | Recherche par proximité GPS |
| Compte client (connexion / inscription) | ✅ Livré | Auth Supabase intégrée |
| Commande invité (sans compte) | ✅ Livré | Email + téléphone uniquement |
| Vue Cuisine — tableau Kanban | 🔄 En cours | Architecture prête, interface en développement |
| Back-office commandes du jour | 🔄 En cours | Architecture prête, interface en développement |
| Repas suspendus (solidarité) | 🔄 En cours | Base de données prête, interface en développement |
| Profil client et historique | 🔄 En cours | Interface en développement |
| Dashboard super-admin multi-camions | 🔄 En cours | Architecture prête |

---

## Pourquoi ces outils ? — Logique no-code / low-code

L'application repose sur quatre services spécialisés, choisis pour leur interface visuelle et leur interopérabilité. **Chaque brique est indépendante et remplaçable.** Vous n'êtes pas enfermé dans une plateforme propriétaire.

| Outil | Ce qu'il fait | Pourquoi ce choix |
|-------|--------------|-------------------|
| **Vercel** | Héberge l'application web | Déploiement automatique à chaque mise à jour du code. Retour à une version précédente en 1 clic. Gratuit jusqu'à un certain volume de trafic |
| **Supabase** | Stocke toutes les données (menu, commandes, clients, paiements) | Table Editor visuel (comme un tableur). Possible de modifier la carte ou voir les commandes directement depuis l'interface, sans écrire de code |
| **Stripe** | Gère les paiements en ligne | Leader mondial, zéro donnée bancaire stockée sur votre serveur. Dashboard visuel pour voir toutes les transactions et faire des remboursements en quelques clics |
| **n8n** | Connecte automatiquement Stripe à votre base de données | Quand un client paie, n8n met la commande à jour tout seul. Interface graphique pour voir chaque étape. Possible d'ajouter de nouvelles automatisations sans développeur |

> **Argument clé :** L'ensemble du flux de commande — de la navigation au paiement — fonctionne sans serveur dédié à maintenir. Vercel, Supabase et Stripe gèrent eux-mêmes la scalabilité, les sauvegardes et la disponibilité 24h/24.

---

## Architecture — Vue d'ensemble

### Les 5 couches de l'application

| Couche | Service | Rôle |
|--------|---------|------|
| Interface client | **Next.js** sur Vercel | Menu, panier, paiement, confirmation, géolocalisation |
| Données + Auth | **Supabase** (PostgreSQL) | 9 tables, authentification, Row Level Security |
| Paiement | **Stripe** Checkout | Session de paiement sécurisée + webhooks |
| Automatisation | **n8n** | Réception webhook Stripe → mise à jour DB → audit |
| Interface staff/admin | Composants **Next.js** (intégrés) | Vue Cuisine, Back-office, Super-admin |

### Comment l'application fonctionne — parcours complet

```
1. Le client ouvre l'app → il voit la carte du food truck
2. Il clique sur "Me géolocaliser" → l'app trouve le camion le plus proche
3. Il ajoute des plats au panier (le stock se vérifie en temps réel)
4. Il choisit un créneau horaire de retrait et entre son email/téléphone
5. Il clique "Commander" → redirigé vers la page de paiement Stripe
6. Il paie avec sa carte bancaire (Stripe gère tout, aucune donnée stockée chez nous)
7. Stripe confirme le paiement → déclenche une notification automatique vers n8n
8. n8n met à jour la commande en statut "payée" dans la base de données
9. Le client voit une page de confirmation avec le récapitulatif de sa commande
10. L'équipe cuisine voit la commande apparaître sur son tableau de bord
```

Diagramme d'architecture complet : [mvp-v1_architecture.mmd](docs/architecture/mvp-v1_architecture.mmd)

---

## Fonctionnalités

### Côté client (livré et fonctionnel)

- Navigation par catégories : Burgers, Tacos, Sides, Drinks
- Recherche textuelle dans la carte
- Fiche produit avec description, allergènes, stock disponible
- Indication "Rupture de stock" et "Plus que X disponibles"
- Panier avec gestion des quantités et suppression d'articles
- Choix d'un créneau horaire de retrait
- Commande en tant qu'invité (sans compte) — email + téléphone
- Inscription / connexion client sécurisée
- Paiement sécurisé via Stripe Checkout
- Page de confirmation post-paiement avec récapitulatif complet
- Géolocalisation GPS pour trouver le food truck le plus proche (rayon 10 km)

### Côté équipe food truck (en cours)

- **Vue Cuisine** (`KitchenBoard`) : tableau Kanban des commandes par statut — architecture prête, interface en développement
- **Back-office** (`BackOffice`) : liste des commandes du jour avec statuts de paiement — architecture prête, interface en développement

### Fonctionnalités futures (en cours de développement)

- Repas suspendus — système de solidarité (voir section dédiée ci-dessous)
- Profil client et historique des commandes
- Statistiques et analytics (chiffre d'affaires, plats les plus vendus)
- Dashboard super-admin multi-camions

---

## Les Repas Suspendus — Fonctionnalité de solidarité

Inspirée du concept du *caffè sospeso* (café suspendu), cette fonctionnalité permet à un client de financer un repas supplémentaire lors de sa commande. Ce repas est mis à disposition d'une personne dans le besoin via un code de retrait unique.

**Comment ça fonctionne :**
1. Lors du paiement, le client peut cocher "Offrir un repas" sur un article de son panier
2. Le repas est enregistré en base de données avec un code de retrait unique (valable 7 jours)
3. Une personne peut récupérer ce repas au food truck en présentant son code
4. L'équipe voit les repas disponibles sur son tableau de bord

**État actuel :** La base de données et la logique métier sont opérationnelles. L'interface utilisateur est en cours de développement.

Cette fonctionnalité différencie le food truck d'une simple borne de commande et renforce son ancrage local et social.

---

## Structure du projet

```
food-truck-app/
├── app/                                  # Application Next.js 15
│   ├── api/orders/
│   │   ├── create/route.ts               # Création de commande + validation stock
│   │   ├── create-checkout-session/      # Création session Stripe
│   │   └── by-session/route.ts           # Récupération commande après paiement
│   ├── components/
│   │   ├── Header.tsx, Footer.tsx
│   │   ├── MenuItemCard.tsx              # Carte produit
│   │   ├── ItemDetailModal.tsx           # Fiche produit détaillée
│   │   ├── CategoryFilter.tsx            # Filtre par catégorie
│   │   ├── CartDrawer.tsx                # Panier latéral
│   │   ├── AuthModal.tsx                 # Connexion / inscription
│   │   ├── ConfirmationPage.tsx          # Page de confirmation post-paiement
│   │   ├── KitchenBoard.tsx              # Vue cuisine (en cours)
│   │   ├── BackOffice.tsx                # Back-office commandes (en cours)
│   │   ├── SuperAdminDashboard.tsx       # Super-admin multi-camions (en cours)
│   │   ├── ProfilePage.tsx               # Profil client (en cours)
│   │   ├── StatsView.tsx                 # Analytics (en cours)
│   │   └── SuspendedMenus.tsx            # Repas suspendus (en cours)
│   ├── success/page.tsx                  # Page de succès post-paiement
│   ├── page.tsx                          # Page principale SPA
│   ├── layout.tsx                        # Layout racine
│   └── globals.css
│
├── schema/
│   └── migrations/                       # 12 migrations PostgreSQL (à exécuter dans l'ordre)
│       ├── 001_init.sql                  # 5 tables + indexes + triggers
│       ├── 001b_audit.sql               # Journal d'audit automatique
│       ├── 001c_menu_enhancements.sql   # Gestion du stock
│       ├── ...
│       └── 004_food_trucks.sql          # Géolocalisation (PostGIS)
│
├── supabase/
│   ├── config.toml                       # Config Supabase local
│   └── functions/make-server-9b4dbeda/  # Edge Functions Deno (API backend)
│       ├── index.ts                      # Routeur principal
│       └── routes/                       # Routes : menu, commandes, stock, checkout...
│
├── automation/
│   └── n8n/
│       └── stripe_checkout_webhook_v1.json  # Workflow n8n (7 nœuds) — à importer
│
├── docs/
│   ├── architecture/                     # ADR, diagrammes, contrats
│   ├── integrations/                     # Guides Stripe, Supabase API
│   └── ops/                              # Déploiement, back-office, audit
│
├── .env.example                          # Modèle de variables d'environnement
└── README.md
```

---

## Base de données — 9 tables

| Table | Description | Clé unique |
|-------|-------------|------------|
| `customers` | Clients (email, nom, téléphone) | `email` |
| `menu_items` | Carte du food truck (nom, prix en centimes, catégorie, stock, disponibilité) | `id` |
| `orders` | Commandes (statut, montant, créneau, notes) | `correlation_id` (= checkout session Stripe) |
| `order_items` | Lignes de commande (snapshot nom + prix au moment de la commande) | `id` |
| `payments` | Paiements Stripe (montant, statut, métadonnées JSON) | `stripe_payment_intent_id` |
| `audit_log` | Journal de traçabilité automatique (toutes les modifications) | `id` |
| `settings` | Configuration de l'app (créneaux horaires, emplacement) | `id = 1` |
| `food_trucks` | Camions et leur géolocalisation (latitude, longitude, horaires) | `id` |
| `suspended_credits` | Repas suspendus disponibles au retrait | `id` |

**Statuts d'une commande :** `pending` → `paid` → `preparing` → `ready` → `completed` | `cancelled`

**Statuts d'un paiement :** `pending` → `succeeded` | `failed` | `refunded`

**Automatismes en base de données :**
- Le champ `updated_at` se met à jour automatiquement à chaque modification (triggers)
- Le journal d'audit est alimenté automatiquement sur chaque CREATE / UPDATE / DELETE des tables sensibles
- Le stock est décrémenté de façon sécurisée (pas de survente si deux clients commandent simultanément)

---

## Démarrage rapide

### A. Reprendre le projet existant (sans reconstruire de zéro)

Si vous reprenez le projet, voici les accès aux tableaux de bord pour vos opérations quotidiennes :

| Outil | Adresse | Ce que vous pouvez faire |
|-------|---------|--------------------------|
| Application | URL Vercel du projet | Voir l'app comme un client |
| Supabase | [app.supabase.com](https://app.supabase.com) | Modifier le menu, voir les commandes, consulter l'audit |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) | Voir les paiements, faire des remboursements |
| n8n | URL de votre instance n8n | Surveiller les automatisations |
| Vercel | [vercel.com](https://vercel.com) | Voir les déploiements, rollback |

#### Modifier la carte (menu) sans coder

1. Aller sur **Supabase** → votre projet → **Table Editor** → table `menu_items`
2. Cliquer sur une ligne pour modifier : nom, description, catégorie, image
3. **Prix :** entrer le montant en centimes (12,50 € = `1250`)
4. **Rendre un plat indisponible :** passer le champ `available` à `false`
5. **Remettre du stock :** modifier le champ `stock_quantity`
6. **Ajouter un plat :** bouton "Insert row" en haut du tableau
7. Les modifications sont visibles immédiatement sur l'application

> ⚠️ Le prix est toujours en **centimes** : 8,90 € → `890` | 14,00 € → `1400`

#### Gérer les créneaux horaires

1. Supabase → Table Editor → table `settings`
2. Modifier le champ `slots` (liste des heures disponibles au format JSON)

---

### B. Nouveau setup développeur (installation complète)

#### Prérequis

- Node.js 18+ et npm
- Compte Supabase (gratuit)
- Compte Stripe (mode test)
- Instance n8n (Cloud ou auto-hébergée)

#### Étapes

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd food-truck-app

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# → Renseigner les valeurs (voir section suivante)

# 4. Lancer en développement local
npm run dev
```

**Base de données — exécuter les migrations dans l'ordre :**

Dans Supabase → SQL Editor, exécuter chaque fichier de `schema/migrations/` dans l'ordre alphabétique (de `001_init.sql` à `004_food_trucks.sql`).

**Edge Functions Supabase — déployer :**

```bash
supabase functions deploy make-server-9b4dbeda
```

**n8n — importer le workflow :**

1. Ouvrir votre dashboard n8n → "Import from file"
2. Sélectionner `automation/n8n/stripe_checkout_webhook_v1.json`
3. Configurer les credentials (voir section n8n ci-dessous)
4. Activer le workflow → copier l'URL du webhook Stripe

**Stripe — configurer le webhook :**

1. Dashboard Stripe → Developers → Webhooks → Add endpoint
2. URL : coller l'URL copiée depuis n8n
3. Événements à souscrire : `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copier le "Signing secret" (`whsec_...`)

---

## Variables d'environnement

Toutes les clés sont à renseigner dans `.env.local` (jamais partagé, jamais dans le code).

```bash
# ─── Supabase ────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=            # URL de votre projet (ex: https://abc.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # Clé publique (commence par eyJ...) — visible dans le frontend
SUPABASE_SERVICE_ROLE=               # Clé privée (NE JAMAIS exposer côté client)

# ─── Stripe ──────────────────────────────────────────────────────────────────
STRIPE_PUBLIC_KEY=                   # Clé publique (pk_test_... ou pk_live_...)
STRIPE_SECRET_KEY=                   # Clé secrète (NE JAMAIS exposer) — sk_test_... ou sk_live_...
STRIPE_WEBHOOK_SECRET=               # Secret de validation des webhooks — whsec_...

# ─── Application ─────────────────────────────────────────────────────────────
APP_BASE_URL=                        # URL publique de l'app (ex: https://votre-app.vercel.app)
CURRENCY=eur                         # Devise — ne pas modifier

# ─── Automatisation ──────────────────────────────────────────────────────────
N8N_WEBHOOK_URL_STRIPE=             # URL du webhook n8n (donnée par n8n après import du workflow)
```

> 🔒 **Règle de sécurité :** Les clés `SERVICE_ROLE` et `SECRET_KEY` ne doivent exister que dans les vaults sécurisés (Vercel Environment Variables, n8n Credentials, Supabase Secrets). Jamais dans le code, jamais dans un message ou un fichier partagé.

Pour Vercel : Settings → Environment Variables → ajouter chaque variable séparément.

---

## n8n — L'automatisation des paiements

n8n est le chef d'orchestre invisible de l'application. Quand Stripe confirme un paiement, n8n déclenche automatiquement 4 actions en quelques secondes :

```
[Stripe] → paiement confirmé ──→ [n8n] → 4 actions automatiques :

  1. Normaliser les données du paiement (montant, email, identifiants)
  2. Enregistrer le paiement dans la base de données Supabase
  3. Mettre à jour la commande en statut "payée"
  4. Tracer l'événement dans le journal d'audit
     (+ si paiement échoué : marquer la commande en échec)
```

**Workflow importé :** `stripe_checkout_webhook_v1` — 7 nœuds

**Idempotence :** Si Stripe renvoie le même événement deux fois (nouveau tentative automatique), n8n ne crée pas de doublon. Il utilise un *upsert* sur l'identifiant unique du paiement.

### Configurer les credentials n8n après import

Dans n8n → Credentials :
- **Stripe** : entrer la clé secrète `sk_test_...` ou `sk_live_...`
- **Supabase** (HTTP Header Auth) : deux en-têtes à configurer
  - `apikey` : votre `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `Authorization` : `Bearer <SUPABASE_SERVICE_ROLE>`

### Surveiller les automatisations au quotidien

1. Ouvrir votre dashboard n8n → **Executions**
2. Chaque ligne = un événement Stripe traité
3. 🟢 Vert = succès | 🔴 Rouge = erreur à investiguer
4. En cas d'erreur : cliquer sur la ligne pour voir l'étape en échec

**Si un paiement a été manqué :** Stripe Dashboard → Developers → Webhooks → sélectionner l'événement → "Resend"

> **Pourquoi n8n plutôt que du code sur mesure ?** Vous voyez chaque étape du traitement dans une interface graphique. Si quelque chose se passe mal, vous identifiez l'étape en échec sans lire de code. Vous pouvez aussi ajouter de nouvelles étapes (envoi d'email, SMS, notification Slack) depuis l'interface visuelle.

---

## Maintenance quotidienne

### Gérer les commandes du jour

1. Supabase → Table Editor → table `orders`
2. Filtrer par `created_at` (aujourd'hui) et `status` (`paid`, `preparing`, `ready`)
3. Les statuts possibles : `pending` → `paid` → `preparing` → `ready` → `completed` | `cancelled`

### Gérer un remboursement

1. Stripe Dashboard → **Payments** → trouver la transaction
2. Cliquer "Refund" → choisir montant total ou partiel
3. Ne pas modifier manuellement la table `payments` dans Supabase — Stripe et n8n se synchronisent automatiquement

### Ajouter ou désactiver un food truck (géolocalisation)

1. Supabase → Table Editor → table `food_trucks`
2. Champs à renseigner : `name`, `latitude`, `longitude`, `address`, `city`, `active`
3. Pour désactiver temporairement : passer `active` à `false`
4. Le camion apparaît (ou disparaît) automatiquement dans l'app dans un rayon de 10 km

### Revenir à une version précédente (rollback)

1. Vercel Dashboard → votre projet → **Deployments**
2. Trouver la version stable → cliquer les trois points → "Promote to Production"
3. Le site est restauré en moins de 2 minutes. La base de données n'est pas affectée.

### Consulter le journal d'audit

Toutes les créations, modifications et suppressions de commandes, paiements et clients sont tracées automatiquement.

1. Supabase → Table Editor → table `audit_log`
2. Colonnes utiles : `event_type` (INSERT/UPDATE/DELETE), `entity_type`, `entity_id`, `payload` (JSON complet), `created_at`

---

## Tests et validation

### Cartes de test Stripe (mode test uniquement)

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Paiement refusé |

Expiration : toute date future. CVC : 3 chiffres quelconques.

### Scénario de test complet (à valider avant chaque mise en production)

1. Ouvrir l'application
2. Chercher un plat dans la barre de recherche
3. Ajouter 2 articles différents au panier
4. Choisir un créneau horaire
5. Entrer un email et un téléphone (si non connecté)
6. Cliquer "Commander" → vérifier la redirection vers Stripe
7. Payer avec la carte `4242 4242 4242 4242`
8. Vérifier la page de confirmation avec le récapitulatif
9. Vérifier dans **Supabase** (Table Editor → `orders`) : statut = `paid`
10. Vérifier dans **n8n** (Executions) : l'exécution est verte

---

## Sécurité

**Principes fondamentaux :**

- Aucune donnée bancaire n'est stockée dans notre base de données. Stripe gère tout.
- Les mots de passe et clés API sont dans des coffres-forts sécurisés (Vercel, Supabase, n8n). Jamais dans le code.
- Les paiements Stripe sont vérifiés par signature numérique — impossible de fabriquer un faux paiement.
- Le stock est décrémenté de façon atomique : si deux clients commandent le dernier plat simultanément, un seul y accède. L'autre est informé en temps réel (zéro survente).
- Chaque modification de commande ou paiement est tracée automatiquement dans le journal d'audit.
- Accès à la base de données restreint selon le rôle (clients voient uniquement leurs données).

---

## Monitoring & Ops

| Service | Dashboard | Ce que vous pouvez faire |
|---------|-----------|--------------------------|
| **n8n** | Executions | Voir les erreurs, relancer un workflow |
| **Stripe** | Developers → Events/Webhooks | Relivrer un événement manqué, voir les paiements |
| **Vercel** | Logs + Deployments | Débugger le runtime, rollback en 1 clic |
| **Supabase** | Table Editor + Logs | Voir et modifier les données, consulter l'audit |

---

## Glossaire technique

| Terme | Définition |
|-------|-----------|
| **Webhook** | Notification automatique envoyée par Stripe à n8n quand un paiement est effectué |
| **Edge Function** | Un petit programme qui tourne sur les serveurs de Supabase pour répondre aux requêtes de l'application |
| **RLS** | Row Level Security — système qui contrôle qui peut voir quoi dans la base de données |
| **Centimes** | Le prix est stocké en centimes (12,50 € = 1250). Standard des services de paiement |
| **Pending** | Commande créée mais pas encore payée |
| **Migration** | Modification de la structure de la base de données (ajout de table, de colonne...) |
| **UUID** | Identifiant unique attribué automatiquement à chaque commande, client ou plat |
| **Upsert** | Opération qui crée un enregistrement s'il n'existe pas, ou le met à jour s'il existe déjà |
| **Audit log** | Journal automatique de toutes les modifications importantes (qui a fait quoi et quand) |
| **Rollback** | Retour à une version précédente de l'application sans perte de données |

---

## Documentation complémentaire

| Document | Contenu |
|----------|---------|
| [decisions.md](docs/architecture/decisions.md) | ADR-001 : Choix d'architecture modulaire, alternatives évaluées, exit plan |
| [contracts.md](docs/architecture/contracts.md) | Contrats d'intégration entre les services (Frontend → Stripe → n8n → Supabase) |
| [stripe.md](docs/integrations/stripe.md) | Configuration Stripe, webhooks, idempotence, retry, tests |
| [supabase-api.md](docs/integrations/supabase-api.md) | Référence API des Edge Functions Supabase |
| [deploy-staging.md](docs/ops/deploy-staging.md) | Déploiement Vercel, variables d'environnement, tests post-deploy |
| [audit-log.md](docs/ops/audit-log.md) | Structure du journal d'audit, requêtes SQL utiles |
| [erd-v1.mmd](docs/schema/erd-v1.mmd) | Diagramme entité-relation (9 tables + relations) |

---

## Roadmap

### Infrastructure backend — Livré

- [x] Schéma base de données (9 tables + triggers + indexes)
- [x] Workflow n8n Stripe — `stripe_checkout_webhook_v1` (7 nœuds)
- [x] Géolocalisation food trucks (PostGIS, recherche par proximité)
- [x] Système repas suspendus (base de données et logique métier)
- [x] Journal d'audit automatique
- [x] Gestion du stock avec sécurité concurrente (anti-survente)

### Frontend client — Livré

- [x] Page principale : menu, catégories, recherche, panier
- [x] Commande invité (sans compte) — email + téléphone
- [x] Authentification client (Supabase Auth)
- [x] Checkout Stripe + page de confirmation
- [x] Géolocalisation GPS en temps réel
- [x] Gestion du stock côté interface (ruptures, stock faible)

### Interfaces staff / admin — En cours

- [ ] Vue Cuisine — tableau Kanban temps réel (`KitchenBoard`)
- [ ] Back-office — liste et gestion des commandes du jour (`BackOffice`)
- [ ] Interface Repas Suspendus (`SuspendedMenus`)
- [ ] Profil client et historique des commandes (`ProfilePage`)
- [ ] Statistiques et analytics (`StatsView`)
- [ ] Dashboard super-admin multi-camions (`SuperAdminDashboard`)

### Production et évolutions futures

- [ ] Domaine custom + Stripe mode production (clés `pk_live_` / `sk_live_`)
- [ ] Notifications SMS / email au client à la confirmation de commande
- [ ] Multi-tenant (plusieurs food trucks avec données isolées par RLS)
- [ ] Analytics avancées (chiffre d'affaires, plats populaires, créneaux chargés)

---

## Exit plan — Sortir d'un outil si besoin

Chaque composant est remplaçable indépendamment, sans tout reconstruire :

| Outil actuel | Alternative possible | Effort |
|--------------|---------------------|--------|
| n8n | Fonctions serverless (Vercel), Temporal | Moyen |
| Supabase | Tout PostgreSQL managé (Neon, Railway, AWS RDS) — SQL standard | Moyen |
| Stripe | Autre PSP (Adyen, Mollie) — abstraction en place | Moyen |
| Vercel | Tout hébergeur Node.js (Railway, Render, Netlify) | Faible |
| Back-office intégré | Retool, Softr, ou outil no-code branché à Supabase | Faible |
