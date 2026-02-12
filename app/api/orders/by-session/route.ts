import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, customer_email, total_amount, currency, status, created_at,
      order_items(menu_item_name, quantity, total_price)
    `)
    .eq('correlation_id', sessionId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(order, { status: 200 });
}
