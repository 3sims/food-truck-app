'use client';

import { OrderItem } from '../lib/types';
import { X, Plus, Minus, Trash2, Heart } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  availableSlots: string[];
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onToggleDonation: (id: string) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  availableSlots,
  selectedSlot,
  onSelectSlot,
  onUpdateQuantity,
  onToggleDonation,
  onRemove,
  onCheckout
}: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const donationTotal = items
    .filter(item => item.isDonation)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = total - donationTotal;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Mon Panier</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Votre panier est vide</p>
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex gap-3">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.price.toFixed(2)}€</p>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg h-fit"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => onToggleDonation(item.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          item.isDonation
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${item.isDonation ? 'fill-current' : ''}`} />
                        {item.isDonation ? 'Don' : 'Offrir'}
                      </button>
                    </div>

                    <div className="text-right font-semibold text-gray-900">
                      {(item.price * item.quantity).toFixed(2)}€
                      {item.isDonation && (
                        <span className="ml-2 text-sm text-pink-600">(offert)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slot Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Créneau de retrait
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => onSelectSlot(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSlot === slot
                          ? 'bg-orange-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-semibold">{total.toFixed(2)}€</span>
                </div>
                {donationTotal > 0 && (
                  <div className="flex justify-between text-sm text-pink-600">
                    <span>Dons suspendus</span>
                    <span>-{donationTotal.toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>{finalTotal.toFixed(2)}€</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={onCheckout}
                disabled={!selectedSlot}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors"
              >
                {selectedSlot ? 'Commander' : 'Sélectionnez un créneau'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}