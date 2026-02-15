// @ts-nocheck — Deno runtime, not Node.js
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/database.ts";
import { sendSMS, createOrderConfirmationSMS, createDonationConfirmationSMS } from "../utils/sms.ts";

export async function handleOrders(req: Request) {
  const supabase = getSupabaseClient();

// ✅ AJOUTER CETTE FONCTION
function generatePickupCode(): string {
  // Génère un code à 6 chiffres unique
  return Math.floor(100000 + Math.random() * 900000).toString();
}

  // GET - Liste des commandes
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          menu_item_name,
          quantity,
          unit_price,
          total_price,
          is_suspended
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transformer les données pour correspondre au format attendu par le frontend
    const orders = data.map(order => ({
      id: order.id,
      customerName: order.customer_email?.split('@')[0] || 'Client',
      customerPhone: order.customer_phone,
      items: order.order_items.map((item: any) => ({
        id: item.id,
        name: item.menu_item_name,
        quantity: item.quantity,
        price: item.unit_price,
        isDonation: item.is_suspended || false
      })),
      total: order.total_amount,
      status: order.status,
      pickupSlot: order.pickup_time,
      createdAt: order.created_at,
      isSuspended: order.order_items.some((item: any) => item.is_suspended)
    }));

    return new Response(
      JSON.stringify(orders),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // POST - Créer une commande
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { items, pickupSlot, customerName, customerPhone } = body;

      // Vérifier le stock
      for (const item of items) {
        const { data: menuItem, error } = await supabase
          .from("menu_items")
          .select("stock_quantity, name")
          .eq("id", item.id)
          .single();

        if (error || !menuItem) {
          return new Response(
            JSON.stringify({ error: `Produit ${item.name} introuvable` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (menuItem.stock_quantity < item.quantity) {
          return new Response(
            JSON.stringify({ error: `Stock insuffisant pour ${menuItem.name}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Calculer le total
      const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      // Créer la commande
      // Générer le code de retrait
      const pickupCode = generatePickupCode();

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_email: customerEmail, // ✅ Utiliser l'email réel
          customer_phone: customerPhone,
          pickup_slot: pickupSlot,
          total_amount: total,
          status: "pending", // ✅ CHANGÉ de "paid" à "pending"
          pickup_code: pickupCode, // ✅ AJOUTÉ
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Vérifier si des items sont des donations
      const hasDonations = items.some((item: any) => item.isDonation);

      // Si donation, créer une entrée dans donations
      if (hasDonations) {
        const { error: donationError } = await supabase
          .from("donations")
          .insert({
            order_id: order.id,
            donor_email: customerEmail,
            donor_phone: customerPhone,
            pickup_code: pickupCode,
            status: "available",
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
          });

        if (donationError) {
          console.error("Error creating donation:", donationError);
        }
      }

      // Si donation, créer une entrée dans donations
        if (hasDonations) {
          // ✅ AJOUTER : Générer QR Code
          const qrData = generateQRData(order.id, pickupCode);
          const qrCodeUrl = await generateQRCode(qrData);

          const { error: donationError } = await supabase
            .from("donations")
            .insert({
              order_id: order.id,
              donor_email: customerEmail,
              donor_phone: customerPhone,
              pickup_code: pickupCode,
              qr_code_url: qrCodeUrl, // ✅ AJOUTÉ
              status: "available",
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });

          if (donationError) {
            console.error("Error creating donation:", donationError);
          }
          // ✅ AJOUTER : Envoi SMS de confirmation
const smsMessage = hasDonations 
  ? createDonationConfirmationSMS({
      donorName: customerName || customerEmail.split('@')[0],
      pickupCode,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  : createOrderConfirmationSMS({
      customerName: customerName || customerEmail.split('@')[0],
      pickupCode,
      pickupSlot,
      location: 'Place de la Bastille, Paris', // TODO: récupérer dynamiquement
      orderTotal: total,
    });

// Envoi asynchrone (ne pas bloquer la réponse)
sendSMS({ to: customerPhone, message: smsMessage }).catch(err => 
  console.error('SMS failed:', err)
);
}

      if (orderError) throw orderError;

      // Créer les items de commande et décrémenter le stock
      for (const item of items) {
        // Insérer l'item
        const { error: itemError } = await supabase
          .from("order_items")
          .insert({
            order_id: order.id,
            menu_item_id: item.id,
            menu_item_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            is_suspended: item.isDonation || false
          });

        if (itemError) throw itemError;

        // Décrémenter le stock
        const { error: stockError } = await supabase.rpc('decrement_stock', {
          item_id: item.id,
          quantity: item.quantity
        });

        if (stockError) {
          console.error("Stock decrement error:", stockError);
        }
      }

      // Retourner la commande créée au format attendu
      const orderResponse = {
        id: order.id,
        customerName,
        customerPhone,
        items: items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          isDonation: item.isDonation || false
        })),
        total,
        status: "paid",
        pickupSlot,
        createdAt: order.created_at
      };

      return new Response(
        JSON.stringify(orderResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
