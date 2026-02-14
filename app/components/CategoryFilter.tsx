'use client';

import { Category } from '../lib/types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: Category | 'All';
  onSelect: (category: Category | 'All') => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
  const allCategories: (Category | 'All')[] = ['All', ...categories];

  const categoryLabels: Record<Category | 'All', string> = {
    'All': '🍽️ Tout',
    'Burgers': '🍔 Burgers',
    'Tacos': '🌮 Tacos',
    'Sides': '🍟 Accompagnements',
    'Drinks': '🥤 Boissons'
  };

  return (
    <div className="flex flex-wrap gap-2">
      {allCategories.map(category => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            selectedCategory === category
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          {categoryLabels[category]}
        </button>
      ))}
    </div>
  );
}