import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Burger Classique',
    description: 'Pain brioche, steak haché 180g, cheddar, tomate, salade, oignons caramélisés',
    price: 12.90,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    stock: 15,
    allergens: ['gluten', 'lactose']
  },
  {
    id: '2',
    name: 'Burger Végétarien',
    description: 'Pain complet, galette de légumes maison, fromage de chèvre, roquette',
    price: 11.90,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400',
    stock: 12,
    allergens: ['gluten', 'lactose']
  },
  {
    id: '3',
    name: 'Tacos Poulet',
    description: 'Poulet mariné, sauce fromagère, frites, crudités',
    price: 9.90,
    category: 'Tacos',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
    stock: 20,
    allergens: ['gluten', 'lactose']
  },
  {
    id: '4',
    name: 'Tacos Végé',
    description: 'Légumes grillés, sauce curry, frites, crudités',
    price: 8.90,
    category: 'Tacos',
    image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400',
    stock: 18,
    allergens: ['gluten']
  },
  {
    id: '5',
    name: 'Frites Maison',
    description: 'Frites fraîches coupées à la main',
    price: 3.50,
    category: 'Sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    stock: 30
  },
  {
    id: '6',
    name: 'Salade Verte',
    description: 'Salade fraîche, vinaigrette maison',
    price: 3.00,
    category: 'Sides',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    stock: 25
  },
  {
    id: '7',
    name: 'Coca-Cola',
    description: '33cl',
    price: 2.50,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
    stock: 50
  },
  {
    id: '8',
    name: 'Eau Minérale',
    description: '50cl',
    price: 1.50,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
    stock: 40
  }
];