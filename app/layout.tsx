import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Food Truck Solidaire',
  description: 'Click & Collect — Commandez en ligne et récupérez votre repas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
