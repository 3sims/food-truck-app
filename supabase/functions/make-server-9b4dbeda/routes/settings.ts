import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/database.ts";
import { verifyAuth, isStaffOrAdmin } from "../_shared/auth.ts";

export async function handleSettings(req: Request) {
  const supabase = getSupabaseClient();

  // GET - Récupérer les paramètres
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .single();

    if (error) {
      // Si pas de settings, retourner valeurs par défaut
      return new Response(
        JSON.stringify({
          location: "Place de la Bastille, Paris",
          slots: ["11:30", "12:00", "12:30", "13:00", "18:30", "19:00", "19:30", "20:00"]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // POST - Mettre à jour les paramètres (admin seulement)
  if (req.method === "POST") {
    try {
      const { user } = await verifyAuth(req);
      
      if (!isStaffOrAdmin(user)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { slots, location } = body;

      const { data, error } = await supabase
        .from("settings")
        .upsert({ 
          id: 1, 
          slots, 
          location,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify(data),
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