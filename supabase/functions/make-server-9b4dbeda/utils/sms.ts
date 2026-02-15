/**
 * Service SMS avec Twilio
 */

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!;

interface SMSOptions {
  to: string;
  message: string;
}

export async function sendSMS({ to, message }: SMSOptions): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio credentials missing');
    return false;
  }

  // Nettoyer le numéro (retirer espaces, tirets)
  const cleanPhone = to.replace(/[\s\-]/g, '');
  
  // S'assurer que le numéro commence par +
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+33${cleanPhone.replace(/^0/, '')}`;

  try {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: formattedPhone,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio error:', error);
      return false;
    }

    console.log('SMS sent successfully to:', formattedPhone);
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
}

/**
 * Templates SMS
 */
export function createOrderConfirmationSMS(data: {
  customerName: string;
  pickupCode: string;
  pickupSlot: string;
  location: string;
  orderTotal: number;
}): string {
  return `
🍔 Commande confirmée !

Bonjour ${data.customerName},

Code de retrait : ${data.pickupCode}
Heure : ${data.pickupSlot}
Lieu : ${data.location}

Montant : ${(data.orderTotal / 100).toFixed(2)}€

Montrez ce SMS au food truck.
Bon appétit ! 😋
  `.trim();
}

export function createDonationConfirmationSMS(data: {
  donorName: string;
  pickupCode: string;
  expiresAt: string;
}): string {
  return `
❤️ Merci pour votre générosité !

Bonjour ${data.donorName},

Votre repas suspendu a été enregistré.
Code : ${data.pickupCode}

Valable jusqu'au : ${new Date(data.expiresAt).toLocaleDateString('fr-FR')}

Un bénéficiaire pourra le retirer gratuitement.
  `.trim();
}

export function createBeneficiaryClaimSMS(data: {
  pickupCode: string;
  pickupSlot: string;
  location: string;
}): string {
  return `
🎁 Repas gratuit réservé !

Code de retrait : ${data.pickupCode}
Heure : ${data.pickupSlot}
Lieu : ${data.location}

Montrez ce SMS au food truck.
Bon appétit ! 😋
  `.trim();
}