import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/database.ts";

export async function handleClaimSuspended(req: Request) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient();
    const { orderId, pickupSlot, fingerprint } = await req.json();

    // Vérifier que la commande existe et est suspendue
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Commande introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasSuspendedItems = order.order_items.some((item: any) => item.is_suspended);
    if (!hasSuspendedItems) {
      return new Response(
        JSON.stringify({ error: "Cette commande n'est pas suspendue" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mettre à jour la commande avec le nouveau créneau
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        pickup_time: pickupSlot,
        status: "preparing",
        notes: `Récupéré par ${fingerprint}`
      })
      .eq("id", orderId)
      .select(`
        *,
        order_items (*)
      `)
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify(updatedOrder),
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