'use client';

import { ShoppingCart, Menu, User, LogOut } from 'lucide-react';

interface HeaderProps {
  view: string;
  setView: (view: any) => void;
  cartCount: number;
  onOpenCart: () => void;
  isComfortMode: boolean;
  onToggleComfort: () => void;
  user: any;
  onAuth: () => void;
  onSignOut: () => void;
}

export function Header({
  view,
  setView,
  cartCount,
  onOpenCart,
  user,
  onAuth,
  onSignOut
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => setView('client')}
            className="text-xl font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            🍔 La Cocotte Roulante
          </button>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <button
                onClick={onAuth}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Connexion
              </button>
            )}

            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}