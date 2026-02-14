'use client';

import { MenuItem } from '../lib/types';
import { ShoppingCart } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  onViewDetail: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAddToCart, onViewDetail }: MenuItemCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div 
        className="relative h-48 cursor-pointer group"
        onClick={() => onViewDetail(item)}
      >
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {item.stock <= 5 && item.stock > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Plus que {item.stock}
          </div>
        )}
        {item.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Rupture de stock</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
          <span className="font-bold text-orange-600 text-lg">{item.price.toFixed(2)}€</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
        
        {item.allergens && item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {item.allergens.map(allergen => (
              <span key={allergen} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                {allergen}
              </span>
            ))}
          </div>
        )}
        
        <button
          onClick={() => onAddToCart(item)}
          disabled={item.stock === 0}
          className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}