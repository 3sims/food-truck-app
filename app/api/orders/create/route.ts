import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

interface OrderItem {
  menu_item_id: string;
  qty: number;
  is_suspended?: boolean;
}

interface CreateOrderRequest {
  items: OrderItem[];
  customer_email: string;
  customer_phone?: string;
  pickup_time?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body: CreateOrderRequest = await req.json();
    const { items, customer_email, customer_phone, pickup_time, notes } = body;

    // Validation
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Items required' }, { status: 400 });
    }
    if (!customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // 1. Fetch menu items and check stock
    const menuItemIds = items.map(i => i.menu_item_id);
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price, stock_quantity, available')
      .in('id', menuItemIds);

    if (menuError || !menuItems) {
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
    }

    // Check availability and stock
    for (const item of items) {
      const menuItem = menuItems.find(m => m.id === item.menu_item_id);
      if (!menuItem) {
        return NextResponse.json({ error: `Menu item ${item.menu_item_id} not found` }, { status: 404 });
      }
      if (!menuItem.available) {
        return NextResponse.json({ error: `${menuItem.name} is not available` }, { status: 400 });
      }
      if (menuItem.stock_quantity < item.qty) {
        return NextResponse.json({ error: `Insufficient stock for ${menuItem.name}` }, { status: 400 });
      }
    }

    // 2. Calculate total amount (server-side, never trust frontend)
    let totalAmount = 0;
    for (const item of items) {
      const menuItem = menuItems.find(m => m.id === item.menu_item_id)!;
      totalAmount += menuItem.price * item.qty;
    }

    // 3. Get or create customer
    let customerId: string | null = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customer_email)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({ email: customer_email, phone: customer_phone })
        .select('id')
        .single();
      
      if (customerError || !newCustomer) {
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    // 4. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        status: 'pending',
        total_amount: totalAmount,
        currency: 'eur',
        customer_email,
        customer_phone,
        pickup_time: pickup_time ? new Date(pickup_time).toISOString() : null,
        notes
      })
      .select('id, total_amount, currency')
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 5. Insert order items
    const orderItemsData = items.map(item => {
      const menuItem = menuItems.find(m => m.id === item.menu_item_id)!;
      return {
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        menu_item_name: menuItem.name,
        quantity: item.qty,
        unit_price: menuItem.price,
        total_price: menuItem.price * item.qty,
        is_suspended: item.is_suspended || false
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      // Rollback order (or let audit trail handle it)
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // 6. Decrement stock (blocking — rollback on failure to prevent overselling)
    for (const item of items) {
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        item_id: item.menu_item_id,
        quantity: item.qty
      });
      if (stockError) {
        console.error('Stock decrement failed:', stockError);
        await supabase.from('order_items').delete().eq('order_id', order.id);
        await supabase.from('orders').delete().eq('id', order.id);
        return NextResponse.json(
          { error: `Stock insuffisant pour l'article demandé` },
          { status: 409 }
        );
      }
    }

    // 7. Return order details
    return NextResponse.json({
      order_id: order.id,
      total_amount: order.total_amount,
      currency: order.currency,
      status: 'pending'
    }, { status: 201 });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
