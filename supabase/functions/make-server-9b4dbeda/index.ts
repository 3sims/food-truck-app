// @ts-nocheck — Deno runtime, not Node.js
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./_shared/cors.ts";
import { handleSettings } from "./routes/settings.ts";
import { handleOrders } from "./routes/orders.ts";
import { handleStock } from "./routes/stock.ts";
import { handleClaimSuspended } from "./routes/claim-suspended.ts";
import { handleLogout } from "./routes/logout.ts";
import { handleBootstrap } from "./routes/bootstrap.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/make-server-9b4dbeda", "");

  try {
    // Route handling
    switch (path) {
      case "/settings":
        return await handleSettings(req);
      
      case "/orders":
        return await handleOrders(req);
      
      case "/stock":
        return await handleStock(req);
      
      case "/claim-suspended":
        return await handleClaimSuspended(req);
      
      case "/logout-global":
        return await handleLogout(req);
      
      case "/bootstrap":
        return await handleBootstrap(req);
      
      default:
        return new Response(
          JSON.stringify({ error: "Not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    console.error("Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});