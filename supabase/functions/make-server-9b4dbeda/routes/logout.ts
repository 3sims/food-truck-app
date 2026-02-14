import { corsHeaders } from "../_shared/cors.ts";
import { verifyAuth } from "../_shared/auth.ts";

export async function handleLogout(req: Request) {
  try {
    const { supabase } = await verifyAuth(req);
    
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Logged out successfully" }),
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