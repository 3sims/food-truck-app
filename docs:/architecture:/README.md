# Architecture — Semaine 1 (MVP Click & Collect)

Fichiers:
- decisions.md — ADR (choix modulaire best‑of‑breed)
- mvp-v1_architecture.mmd — Schéma Mermaid (exportable en PNG/PDF)
- contracts.md — Contrats d'intégration (endpoints, webhooks, env vars)

Export schéma:
- Utiliser https://mermaid.live pour exporter mvp-v1_architecture.mmd en PNG/PDF et l'enregistrer sous docs/architecture/mvp-v1_architecture.png/.pdf.

Étapes suivantes Rôle B:
- Créer projet Supabase + Stripe (mode test).
- Déployer n8n (Cloud ou Docker + ngrok) et sécuriser le webhook.
- Importer le workflow n8n fourni (automation/n8n/stripe_checkout_webhook_v1.json).
- Passer à la création du schéma DB (001_init.sql) et de l'audit (001b_audit.sql).