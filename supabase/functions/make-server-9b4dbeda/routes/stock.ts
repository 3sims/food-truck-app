import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/database.ts";
import { verifyAuth, isStaffOrAdmin } from "../_shared/auth.ts";

export async function handleStock(req: Request) {
  const supabase = getSupabaseClient();

  // GET - Récupérer le stock
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, stock_quantity");

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transformer en objet { itemId: quantity }
    const stock = data.reduce((acc: any, item: any) => {
      acc[item.id] = item.stock_quantity;
      return acc;
    }, {});

    return new Response(
      JSON.stringify(stock),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // POST - Mettre à jour le stock (admin seulement)
  if (req.method === "POST") {
    try {
      const { user } = await verifyAuth(req);
      
      if (!isStaffOrAdmin(user)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { itemId, quantity } = await req.json();

      const { error } = await supabase
        .from("menu_items")
        .update({ stock_quantity: quantity })
        .eq("id", itemId);

      if (error) throw error;

      // Retourner tout le stock mis à jour
      const { data } = await supabase
        .from("menu_items")
        .select("id, stock_quantity");

      const stock = data?.reduce((acc: any, item: any) => {
        acc[item.id] = item.stock_quantity;
        return acc;
      }, {});

      return new Response(
        JSON.stringify(stock),
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