'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Confirmation de votre commande...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!sessionId) {
        setError('Session ID manquant');
        setLoading(false);
        return;
      }

      try {
        // Récupérer les infos de la commande via le session_id
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?stripe_session_id=eq.${sessionId}&select=*`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
          }
        });

        if (!response.ok) {
          throw new Error('Commande introuvable');
        }

        const orders = await response.json();
        
        if (!orders || orders.length === 0) {
          throw new Error('Commande introuvable');
        }

        const orderData = orders[0];

        setOrder({
          id: orderData.id.substring(0, 13).toUpperCase(),
          pickupCode: orderData.pickup_code,
          pickupTime: new Date(orderData.pickup_time).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          total: (orderData.total_amount / 100).toFixed(2),
          customerEmail: orderData.customer_email,
          customerPhone: orderData.customer_phone
        });
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Erreur lors de la récupération de la commande');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Confirmation de votre commande...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Commande introuvable</h1>
          <p className="text-gray-600 mb-6">{error || 'Impossible de récupérer les détails de votre commande.'}</p>
          <Link 
            href="/"
            className="inline-block bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Success */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
          <CheckCircle className="w-20 h-20 mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold mb-2">Paiement réussi !</h1>
          <p className="text-green-50 text-lg">Votre commande a été confirmée</p>
        </div>

        {/* Order Details */}
        <div className="p-8 space-y-6">
          {/* Pickup Code */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-600 mb-2 font-medium">Code de retrait</p>
            <p className="text-5xl font-bold text-orange-600 tracking-wider">
              {order.pickupCode}
            </p>
            <p className="text-xs text-gray-500 mt-2">Montrez ce code au food truck</p>
          </div>

          {/* Pickup Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <Clock className="w-6 h-6 text-orange-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Heure de retrait</p>
                <p className="text-lg font-bold text-gray-900">{order.pickupTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <MapPin className="w-6 h-6 text-orange-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Lieu</p>
                <p className="text-sm font-bold text-gray-900">Place de la Bastille</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Numéro de commande</span>
              <span className="font-mono font-semibold text-gray-900">{order.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Montant payé</span>
              <span className="text-2xl font-bold text-green-600">{order.total} €</span>
            </div>
          </div>

          {/* SMS Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              📱 <strong>Un SMS de confirmation</strong> a été envoyé à {order.customerPhone} avec tous les détails.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link 
              href="/"
              className="flex-1 bg-orange-600 text-white py-4 rounded-xl font-semibold text-center hover:bg-orange-700 transition-all hover:scale-105 shadow-lg"
            >
              Retour à l'accueil
            </Link>
            <button 
              onClick={() => window.print()}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Imprimer le reçu
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center border-t">
          <p className="text-sm text-gray-500">
            Merci pour votre commande ! 🍔
          </p>
        </div>
      </div>
    </div>
  );
}