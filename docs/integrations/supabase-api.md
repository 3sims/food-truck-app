# API Supabase — Documentation complète (Semaines 1 & 2)

Date: 2026-02-12  
Owner: Rôle B — Product Builder B  
Project: Food Truck Solidaire

---

## CONFIGURATION

### Base URL
https://uxhymccilxfwltlvmlzc.supabase.co/rest/v1

### Headers requis

#### Lecture publique (frontend, Retool)
```http
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type: application/json
Écriture / Admin (backend Next.js, n8n)
apikey: <SUPABASE_SERVICE_ROLE>
Authorization: Bearer <SUPABASE_SERVICE_ROLE>
Content-Type: application/json
Prefer: resolution=merge-duplicates
⚠️ ATTENTION : Le service_role donne un accès admin complet. Ne jamais l'exposer côté frontend ou dans Git.
ENDPOINTS — MENU (Semaine 1)
1. Lister tous les plats disponibles
Endpoint:
GET https://uxhymccilxfwltlvmlzc.supabase.co/rest/v1/menu_items
Query parameters:
available=eq.true : uniquement les plats disponibles
stock_quantity=gt.0 : avec stock > 0
category=eq.plat : filtrer par catégorie (plat, dessert, boisson)
select=id,name,price,description,image_url,allergens,stock_quantity
Exemple curl:
curl "https://uxhymccilxfwltlvmlzc.supabase.co/rest/v1/menu_items?available=eq.true&stock_quantity=gt.0&select=*" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"
Response 200:
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Burger Solidaire",
    "description": "Steak haché, salade, tomate, fromage, pain artisanal",
    "price": 850,
    "currency": "eur",
    "category": "plat",
    "available": true,
    "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    "ingredients": "Pain de blé, bœuf français, laitue, tomate, cheddar, sauce maison",
    "allergens": "Gluten, Lactose",
    "stock_quantity": 50,
    "created_at": "2026-02-12T10:00:00.000Z",
    "updated_at": "2026-02-12T10:00:00.000Z"
  }
]
2. Détail d'un plat
Endpoint:
GET https://uxhymccilxfwltlvmlzc.supabase.co/rest/v1/menu_items?id=eq.{UUID}
Exemple curl:
curl "https://uxhymccilxfwltlvmlzc.supabase.co/rest/v1/menu_items?id=eq.550e8400-e29b-41d4-a716-446655440000&select=*" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"
ENDPOINTS — COMMANDES (via Next.js API, Semaine 1)
3. Créer une commande
Endpoint:
POST /api/orders/create
Headers:
Content-Type: application/json
Body:
{
  "items": [
    {
      "menu_item_id": "550e8400-e29b-41d4-a716-446655440000",
      "qty": 2,
      "is_suspended": false
    }
  ],
  "customer_email": "client@example.com",
  "customer_phone": "+33612345678",
  "pickup_time": "2026-02-12T18:30:00Z",
  "notes": "Sans oignon SVP"
}
Response 201:
{
  "order_id": "660e8400-e29b-41d4-a716-446655440099",
  "total_amount": 1700,
  "currency": "eur",
  "status": "pending"
}
4. Créer une session de paiement Stripe
Endpoint:
POST /api/orders/create-checkout-session
Body:
{
  "order_id": "660e8400-e29b-41d4-a716-446655440099"
}
Response 200:
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_xxxxxxxxxxxxx"
}
5. Récupérer une commande après paiement
Endpoint:
GET /api/orders/by-session?session_id={CHECKOUT_SESSION_ID}
Response 200:
{
  "id": "660e8400-e29b-41d4-a716-446655440099",
  "customer_email": "client@example.com",
  "total_amount": 1700,
  "currency": "eur",
  "status": "paid",
  "order_items": [...]
}
ENDPOINTS — REPAS SUSPENDUS (Semaine 2)
6. Lister les repas suspendus disponibles
Endpoint:
GET https://uxhymccilxfwltlvmlzc.supabase.co/rest/v1/suspended_credits?quantity_remaining=gt.0
Exemple curl:
curl "https://uxhymccilxfwltlvmlzc.supabase.co/rest/v1/suspended_credits?quantity_remaining=gt.0&select=*" \
  -H "apikey: <SUPABASE_ANON_KEY>"
7. Accepter un repas suspendu et obtenir un voucher
Endpoint:
POST /api/vouchers/issue
Body:
{
  "suspended_credit_id": "770e8400-e29b-41d4-a716-446655440000",
  "beneficiary_email": "beneficiaire@example.com"
}
Response 201:
{
  "voucher_id": "990e8400-e29b-41d4-a716-446655440000",
  "code": "A3F7B2E9",
  "qr_url": "https://uxhymccilxfwltlvmlzc.supabase.co/storage/v1/object/public/vouchers/A3F7B2E9.png",
  "maps_link": "https://maps.google.com/?q=48.867435,2.364093",
  "status": "issued"
}
8. Valider un voucher (scan QR opérateur)
Endpoint:
POST /api/vouchers/redeem
Body:
{
  "code": "A3F7B2E9"
}
Response 200:
{
  "success": true,
  "message": "Repas validé avec succès !",
  "menu_item_name": "Burger Solidaire"
}
CONFIGURATION n8n
Variables d'environnement à ajouter dans n8n
Dans n8n Cloud → Settings → Environment Variables :
SUPABASE_URL=https://uxhymccilxfwltlvmlzc.supabase.co
SUPABASE_SERVICE_ROLE=<SUPABASE_SERVICE_ROLE>
Dans les nœuds HTTP Request de n8n
URL:
{{$env.SUPABASE_URL}}/rest/v1/payments
Headers:
{
  "apikey": "{{$env.SUPABASE_SERVICE_ROLE}}",
  "Authorization": "Bearer {{$env.SUPABASE_SERVICE_ROLE}}",
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates"
}