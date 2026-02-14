'use client';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">🍔 La Cocotte Roulante</h3>
            <p className="text-gray-400 text-sm">
              Street food de qualité, préparée avec amour
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Horaires</h4>
            <p className="text-gray-400 text-sm">
              Lundi - Vendredi: 11h30 - 22h00<br />
              Weekend: 12h00 - 23h00
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-gray-400 text-sm">
              📧 contact@lacocotteroulante.fr<br />
              📱 06 12 34 56 78
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          © 2026 La Cocotte Roulante. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}