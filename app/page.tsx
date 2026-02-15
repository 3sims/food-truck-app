'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Header } from './components/Header';
import { MenuItemCard } from './components/MenuItemCard';
import { CategoryFilter } from './components/CategoryFilter';
import { CartDrawer } from './components/CartDrawer';
import { KitchenBoard } from './components/KitchenBoard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { SuspendedMenus } from './components/SuspendedMenus';
import { BackOffice } from './components/BackOffice';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ConfirmationPage } from './components/ConfirmationPage';
import { ProfilePage } from './components/ProfilePage';
import { StatsView } from './components/StatsView';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { MenuItem, Category, OrderItem, Order } from './lib/types';
import { Search, MapPin, Clock, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from './utils/supabase/info';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const getFingerprint = () => {
  if (typeof window === 'undefined') return '';
  let fp = localStorage.getItem('bt_fp');
  if (!fp) {
    fp = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('bt_fp', fp);
  }
  return fp;
};

export default function App() {
  const [view, setView] = useState<'client' | 'staff' | 'stats' | 'suspended' | 'backoffice' | 'superadmin' | 'confirmation' | 'profile'>('client');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  
  // Data
  const [location, setLocation] = useState("Place de la Bastille, Paris");
  const [pickupSlots, setPickupSlots] = useState<string[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isComfortMode, setIsComfortMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rawMenuItems, setRawMenuItems] = useState<MenuItem[]>([]);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [nearestTrucks, setNearestTrucks] = useState<any[]>([]);
  
  const categories: Category[] = ['Burgers', 'Tacos', 'Sides', 'Drinks'];

  const fetchMenuItems = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9b4dbeda/menu-items`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const items = await res.json();
      setRawMenuItems(items.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price / 100,
        category: item.category,
        image: item.image_url,
        stock: item.stock_quantity,
        allergens: item.allergens?.split(',') || []
      })));
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Computed Menu Items with real stock
  const menuItems: MenuItem[] = useMemo(() => {
    return rawMenuItems.map((item: MenuItem) => ({
      ...item,
      stock: stock[item.id] !== undefined ? stock[item.id] : item.stock
    }));
  }, [rawMenuItems, stock]);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          
          try {
            const res = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-9b4dbeda/food-trucks?lat=${latitude}&lon=${longitude}&maxDistance=10`,
              { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
            );
            const trucks = await res.json();
            setNearestTrucks(trucks);
            
            if (trucks.length > 0) {
              setLocation(trucks[0].address);
              toast.success(`Food truck trouvé à ${trucks[0].distance_km} km`);
            } else {
              toast.info('Aucun food truck à proximité');
            }
          } catch (error) {
            console.error('Error fetching food trucks:', error);
            toast.error('Erreur lors de la recherche de food trucks');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Impossible de vous géolocaliser');
        }
      );
    } else {
      toast.error('Géolocalisation non disponible');
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [settingsRes, ordersRes, stockRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9b4dbeda/settings`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9b4dbeda/orders`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9b4dbeda/stock`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ]);

      const settings = await settingsRes.json();
      const initialOrders = await ordersRes.json();
      const currentStock = await stockRes.json();

      setLocation(settings.location);
      setPickupSlots(settings.slots);
      setOrders(initialOrders);
      setStock(currentStock);

      if (typeof window !== 'undefined') {
        const sessionStr = localStorage.getItem('supabase_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          setUser(session.user);
        }
      }
    } catch (err) {
      console.error('Failed to fetch initial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, menuItems]);

  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0) {
      toast.error('Désolé, ce produit est en rupture de stock.');
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          toast.warning('Quantité maximale atteinte pour ce produit.');
          return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, isDonation: false }];
    });
    toast.success(`${item.name} ajouté au panier`);
  };

  const updateQuantity = (id: string, delta: number) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    setCartItems(prev => prev.map(cartItem => {
      if (cartItem.id === id) {
        const newQty = Math.max(1, cartItem.quantity + delta);
        if (newQty > item.stock) {
          toast.warning(`Seulement ${item.stock} disponibles`);
          return cartItem;
        }
        return { ...cartItem, quantity: newQty };
      }
      return cartItem;
    }));
  };

  const toggleDonation = (id: string) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, isDonation: !item.isDonation } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckout = async () => {
    const email = user?.email || guestEmail;
    const phone = user?.user_metadata?.phone || guestPhone;

    if (!email || !phone) {
      toast.error('Email et téléphone requis pour la commande');
      return;
    }

    if (!selectedSlot) {
      toast.error('Veuillez choisir un créneau horaire');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9b4dbeda/create-checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            isDonation: item.isDonation || false
          })),
          email,
          phone,
          pickupSlot: selectedSlot
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.checkout_url) {
        throw new Error('URL de paiement manquante');
      }

      toast.success('Redirection vers le paiement...');
      window.location.href = data.checkout_url;

    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Erreur lors de la commande');
    }
  };

  const handleAuthSuccess = (session: any) => {
    setUser(session.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_session', JSON.stringify(session));
      localStorage.setItem('supabase_access_token', session.access_token);
    }
    fetchData();
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    setUser(null);
    toast.info('Déconnexion réussie');
    setView('client');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-orange-50">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
        <p className="font-bold text-orange-900 animate-pulse">Chargement de votre Food Truck...</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-all duration-500",
      isComfortMode ? "bg-white text-gray-900" : "bg-gray-50/50"
    )}>
      <Toaster position="top-center" richColors />
      
      <Header 
        view={view} 
        setView={setView} 
        cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        isComfortMode={isComfortMode}
        onToggleComfort={() => setIsComfortMode(!isComfortMode)}
        user={user}
        onAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      <main className={cn(
        "transition-all duration-300",
        isComfortMode && "max-w-4xl mx-auto px-4 text-lg leading-relaxed"
      )}>
        {view === 'client' && (
          <div className="space-y-8 pb-20">
            {!isComfortMode && (
              <section className="relative h-[250px] md:h-[350px] flex items-center justify-center text-white overflow-hidden">
                <img src="https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=1200" className="absolute inset-0 w-full h-full object-cover" alt="Food Truck" />
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10 text-center px-4 max-w-2xl">
                  <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">La Cocotte Roulante</h1>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm font-medium">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      <span>{location}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span>Ouvert • Ferme à 22h00</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8", isComfortMode && "pt-8")}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CategoryFilter categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Rechercher un plat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-white border-gray-100 focus:ring-2 focus:ring-orange-500 shadow-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map(item => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    onAddToCart={addToCart} 
                    onViewDetail={setSelectedItem}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {view === 'confirmation' && currentOrder && (
          <ConfirmationPage order={currentOrder} onBack={() => setView('client')} />
        )}
      </main>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        availableSlots={pickupSlots}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        onUpdateQuantity={updateQuantity}
        onToggleDonation={toggleDonation}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        user={user}
        guestEmail={guestEmail}
        guestPhone={guestPhone}
        onSetGuestEmail={setGuestEmail}
        onSetGuestPhone={setGuestPhone}
      />

      <ItemDetailModal 
        item={selectedItem ? menuItems.find(i => i.id === selectedItem.id) || selectedItem : null} 
        onClose={() => setSelectedItem(null)} 
        onAddToCart={addToCart} 
      />
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={handleAuthSuccess} 
      />

      <Footer />

      {/* Bouton géolocalisation - CORRECTEMENT PLACÉ */}
      <button
        onClick={getUserLocation}
        className="fixed bottom-20 right-4 z-50 bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition-all hover:scale-110"
        aria-label="Géolocaliser les food trucks"
      >
        <MapPin className="w-6 h-6" />
      </button>

      {/* Liste food trucks proches */}
      {nearestTrucks.length > 0 && (
        <div className="fixed bottom-32 right-4 z-40 bg-white p-4 rounded-lg shadow-xl max-w-xs border border-gray-200">
          <h3 className="font-bold text-sm mb-2">Food trucks à proximité :</h3>
          <ul className="space-y-1 text-xs">
            {nearestTrucks.map((truck) => (
              <li key={truck.id} className="flex justify-between items-center py-1">
                <span className="font-medium">{truck.name}</span>
                <span className="text-gray-500 bg-orange-50 px-2 py-0.5 rounded">{truck.distance_km} km</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}