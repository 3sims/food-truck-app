export type Category = 'Burgers' | 'Tacos' | 'Sides' | 'Drinks';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  stock: number;
  allergens?: string[];
}

export interface OrderItem extends MenuItem {
  quantity: number;
  isDonation: boolean;
}

export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  pickupSlot: string;
  createdAt: string;
  isSuspended?: boolean;
}