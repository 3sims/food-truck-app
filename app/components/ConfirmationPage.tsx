'use client';

import { Order } from '../lib/types';
import { CheckCircle, Clock, MapPin, ArrowLeft } from 'lucide-react';

interface ConfirmationPageProps {
  order: Order;
  onBack: () => void;
}

export function ConfirmationPage({ order, onBack }: ConfirmationPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Commande confirmée !</h1>
            <p className="text-gray-600">Merci {order.customerName} pour votre commande</p>
          </div>

          <div className="border-t border-b border-gray-200 py-6 space-y-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Créneau de retrait</p>
                <p className="font-semibold">{order.pickupSlot}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <MapPin className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Lieu de retrait</p>
                <p className="font-semibold">Place de la Bastille, Paris</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                  {item.isDonation && <span className="ml-2 text-pink-600">(don)</span>}
                </span>
                <span className="font-medium text-gray-900">
                  {(item.price * item.quantity).toFixed(2)}€
                </span>
              </div>
            ))}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t">
              <span>Total</span>
              <span>{order.total.toFixed(2)}€</span>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au menu
          </button>
        </div>
      </div>
    </div>
  );
}