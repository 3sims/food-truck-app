/**
 * Génère un QR Code en base64
 * @param data - Données à encoder (pickup_code)
 * @returns URL data:image/png;base64
 */
export async function generateQRCode(data: string): Promise<string> {
  // Utiliser l'API QR Server (gratuit, pas de dépendance)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  
  try {
    const response = await fetch(qrApiUrl);
    if (!response.ok) throw new Error('QR generation failed');
    
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('QR Code generation error:', error);
    // Fallback : retourner une URL simple
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  }
}

/**
 * Génère le contenu à encoder dans le QR Code
 */
export function generateQRData(orderId: string, pickupCode: string): string {
  return JSON.stringify({
    orderId,
    pickupCode,
    type: 'food-truck-order',
    timestamp: new Date().toISOString()
  });
}