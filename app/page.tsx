'use client';

import { useEffect, useState } from 'react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  available: boolean;
  image_url: string;
  allergens: string;
  stock_quantity: number;
}

interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  qty: number;
}

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/menu_items?available=eq.true&stock_quantity=gt.0&select=*`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMenuItems(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === item.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  }

  function removeFromCart(menuItemId: string) {
    setCart((prev) =>
      prev
        .map((c) => (c.menu_item_id === menuItemId ? { ...c, qty: c.qty - 1 } : c))
        .filter((c) => c.qty > 0)
    );
  }

  function getCartQty(menuItemId: string) {
    return cart.find((c) => c.menu_item_id === menuItemId)?.qty || 0;
  }

  const totalAmount = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  async function handleOrder() {
    if (cart.length === 0) return;
    if (!email) {
      setError('Veuillez entrer votre email.');
      return;
    }
    setError('');
    setOrdering(true);

    try {
      // 1. Create order
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({
            menu_item_id: c.menu_item_id,
            qty: c.qty,
            is_suspended: false,
          })),
          customer_email: email,
          customer_phone: phone || undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || 'Erreur lors de la commande.');
        setOrdering(false);
        return;
      }

      // 2. Create checkout session
      const checkoutRes = await fetch('/api/orders/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderData.order_id }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        setError(checkoutData.error || 'Erreur lors du paiement.');
        setOrdering(false);
        return;
      }

      // 3. Redirect to Stripe
      window.location.href = checkoutData.checkout_url;
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setOrdering(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Chargement du menu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold">Food Truck Solidaire</h1>
        <p className="text-gray-600 mt-2">
          Commandez en ligne et recuperez votre repas au food truck
        </p>
      </header>

      {menuItems.length === 0 ? (
        <p className="text-center text-gray-500">Aucun plat disponible pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {menuItems.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <span className="font-bold text-green-700">
                    {(item.price / 100).toFixed(2)} EUR
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                {item.allergens && (
                  <p className="text-xs text-orange-600 mb-3">
                    Allergenes : {item.allergens}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded-full border text-lg leading-none hover:bg-gray-100"
                    disabled={getCartQty(item.id) === 0}
                  >
                    -
                  </button>
                  <span className="font-medium">{getCartQty(item.id)}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 rounded-full border text-lg leading-none hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Votre commande</h2>
          <ul className="space-y-2 mb-4">
            {cart.map((c) => (
              <li key={c.menu_item_id} className="flex justify-between">
                <span>
                  {c.name} x {c.qty}
                </span>
                <span>{((c.price * c.qty) / 100).toFixed(2)} EUR</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold text-lg border-t pt-3 mb-4">
            <span>Total</span>
            <span>{(totalAmount / 100).toFixed(2)} EUR</span>
          </div>

          <div className="space-y-3 mb-4">
            <input
              type="email"
              placeholder="Votre email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <input
              type="tel"
              placeholder="Telephone (optionnel)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            onClick={handleOrder}
            disabled={ordering}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {ordering ? 'Redirection vers le paiement...' : `Payer ${(totalAmount / 100).toFixed(2)} EUR`}
          </button>
        </div>
      )}
    </div>
  );
}
