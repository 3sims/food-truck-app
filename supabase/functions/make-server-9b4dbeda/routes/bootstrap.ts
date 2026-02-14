import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/database.ts";

export async function handleBootstrap(req: Request) {
  try {
    const supabase = getSupabaseClient();

    // Créer un utilisateur admin par défaut
    const adminEmail = "admin@foodtruck.com";
    const adminPassword = "admin123"; // À changer immédiatement après!

    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: "superadmin",
        name: "Super Admin"
      }
    });

    if (error && !error.message.includes("already")) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        message: "Admin bootstrapped successfully",
        email: adminEmail,
        note: "Please change the password immediately!"
      }),
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