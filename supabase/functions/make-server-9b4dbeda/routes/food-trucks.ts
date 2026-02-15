import { corsHeaders } from "../_shared/cors.ts";

export async function handleFoodTrucks(req: Request, supabase: any) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // GET /food-trucks?lat=48.8566&lon=2.3522&maxDistance=10
  if (req.method === "GET") {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') || '0');
    const lon = parseFloat(url.searchParams.get('lon') || '0');
    const maxDistance = parseFloat(url.searchParams.get('maxDistance') || '10');

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Latitude et longitude requises' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const { data, error } = await supabase.rpc('find_nearest_truck', {
        user_lat: lat,
        user_lon: lon,
        max_distance_km: maxDistance
      });

      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error('Find nearest truck error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
}