import Stripe from 'stripe';

export async function handleCreateCheckout(req: Request) {
  if (req.method !== "POST") return methodNotAllowed();
  
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
  const { items, email, phone, pickupSlot } = await req.json();
  
  // Vérifier les prix côté serveur (sécurité)
  const supabase = getSupabaseClient();
  const lineItems = [];
  
  for (const item of items) {
    const { data } = await supabase
      .from("menu_items")
      .select("name, price")
      .eq("id", item.id)
      .single();
    
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: data.name },
        unit_amount: data.price, // Prix en centimes
      },
      quantity: item.quantity
    });
  }
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${Deno.env.get('APP_BASE_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get('APP_BASE_URL')}/cancel`,
    metadata: {
      customer_email: email,
      customer_phone: phone,
      pickup_slot: pickupSlot,
      items: JSON.stringify(items)
    }
  });
  
  return new Response(JSON.stringify({ checkout_url: session.url }), {
    headers: corsHeaders
  });
}