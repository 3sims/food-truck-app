'use client';

import { MenuItem } from '../lib/types';
import { X, ShoppingCart, AlertCircle } from 'lucide-react';

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem) => void;
}

export function ItemDetailModal({ item, onClose, onAddToCart }: ItemDetailModalProps) {
  if (!item) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-64 object-cover rounded-t-2xl"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  {item.category}
                </span>
              </div>
              <span className="text-3xl font-bold text-orange-600">{item.price.toFixed(2)}€</span>
            </div>

            <p className="text-gray-700 leading-relaxed">{item.description}</p>

            {item.allergens && item.allergens.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-orange-900">Allergènes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.allergens.map(allergen => (
                    <span key={allergen} className="px-3 py-1 bg-white rounded-full text-sm text-orange-700 border border-orange-200">
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm">
                <span className="text-gray-600">Stock disponible: </span>
                <span className={`font-bold ${item.stock <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                  {item.stock} unité(s)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onAddToCart(item);
                onClose();
              }}
              disabled={item.stock === 0}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {item.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}