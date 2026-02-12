import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

interface CheckoutRequest {
  order_id: string;
}

interface OrderItemRow {
  menu_item_name: string;
  quantity: number;
  unit_price: number;
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = getSupabase();
    const { order_id }: CheckoutRequest = await req.json();

    if (!order_id) {
      return NextResponse.json({ error: 'order_id required' }, { status: 400 });
    }

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, total_amount, currency, customer_email, status,
        order_items(menu_item_name, quantity, unit_price)
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order already processed' }, { status: 400 });
    }

    // Build line items for Stripe
    const lineItems = (order.order_items as OrderItemRow[]).map((item) => ({
      price_data: {
        currency: order.currency,
        unit_amount: item.unit_price,
        product_data: {
          name: item.menu_item_name
        }
      },
      quantity: item.quantity
    }));

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.APP_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_BASE_URL}/cancel`,
      customer_email: order.customer_email,
      metadata: {
        order_id: order.id
      }
    });

    // Update order with correlation_id (checkout session id)
    await supabase
      .from('orders')
      .update({ correlation_id: session.id })
      .eq('id', order_id);

    return NextResponse.json({ checkout_url: session.url }, { status: 200 });

  } catch (error) {
    console.error('Checkout session error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
