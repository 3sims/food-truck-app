```markdown
# Déploiement staging — Semaine 1

## Objectif
Environnement de test public pour valider le flux e2e avant prod.

## Plateforme
Vercel (ou Netlify)

## Configuration Vercel

### Projet
- Nom: `food-truck-staging`
- Branch: `main` (ou `staging`)
- Framework: Next.js

### Variables d'environnement
Ajouter dans Vercel → Settings → Environment Variables:
- `STRIPE_PUBLIC_KEY`: pk_test_xxxxx
- `STRIPE_SECRET_KEY`: sk_test_xxxxx
- `SUPABASE_URL`: https://xxxxx.supabase.co
- `SUPABASE_ANON_KEY`: eyJxxx...
- `APP_BASE_URL`: https://food-truck-staging.vercel.app
- `CURRENCY`: eur

### Protection d'accès
- Vercel Password Protection (Settings → Deployment Protection)
- Ou auth Supabase (préférable pour S2+)

### Domaines
- Staging: `food-truck-staging.vercel.app`
- Prod (S3): domaine custom

## Déploiement

### Push auto
- Chaque push sur `main` déclenche un build
- Prévisualisation: URL unique par commit

### Tests post-déploiement
1. Accès à la page d'accueil
2. Ajout panier → Checkout Stripe (mode test)
3. Paiement avec carte test `4242 4242 4242 4242`
4. Vérifier webhook reçu dans n8n
5. Vérifier commande dans Supabase (table `orders`, `payments`, `audit_log`)
6. Vérifier dans le back-office (Retool/Softr)

## Rollback
- Vercel → Deployments → sélectionner version précédente → "Promote to Production"
- Ou revert commit Git + push

## Logs & monitoring
- Vercel logs: Dashboard → Logs
- n8n executions: Dashboard → Executions
- Stripe events: Dashboard → Developers → Events
