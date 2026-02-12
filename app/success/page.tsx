'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface OrderItemDetail {
  menu_item_name: string;
  quantity: number;
  total_price: number;
}

interface OrderDetail {
  id: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  order_items: OrderItemDetail[];
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setOrder(null);
        } else {
          setOrder(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Commande introuvable</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-green-800 mb-2">
          Paiement confirme !
        </h1>
        <p className="text-green-700">
          Votre commande <strong>#{order.id.slice(0, 8)}</strong> est bien enregistree.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Recapitulatif</h2>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-gray-600">Email :</dt>
            <dd className="font-medium">{order.customer_email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Montant :</dt>
            <dd className="font-medium">{(order.total_amount / 100).toFixed(2)} EUR</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Statut :</dt>
            <dd className="font-medium text-green-600">Payee</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Repas commandes</h2>
        <ul className="space-y-2">
          {order.order_items?.map((item, idx) => (
            <li key={idx} className="flex justify-between">
              <span>{item.menu_item_name} x {item.quantity}</span>
              <span>{(item.total_price / 100).toFixed(2)} EUR</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Retrait</h2>
        <p className="text-sm text-gray-700 mb-3">
          Un SMS de confirmation vous a ete envoye avec un lien vers notre position.
        </p>
        <a
          href="https://maps.google.com/?q=48.867435,2.364093"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Ouvrir dans Google Maps
        </a>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
