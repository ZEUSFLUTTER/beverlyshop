import { formatCurrency, formatDateTime } from './utils';

export interface InvoiceItem {
  libelle: string;
  quantiteVendue: number;
  prixUnitaireVente: number;
}

export interface InvoiceData {
  numero: string;
  date: Date | string;
  vendeur?: string;
  clientNom?: string;
  entreprise?: string;
  items: InvoiceItem[];
}

/**
 * Génère un numéro de facture lisible : FAC-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FAC-${y}${m}${d}-${rand}`;
}

// Indicatif pays par défaut : Togo (+228)
export const DEFAULT_COUNTRY_CODE = '228';

/**
 * Normalise un numéro de téléphone pour l'URL wa.me (chiffres uniquement,
 * sans "+", espaces ni séparateurs). Si aucun indicatif n'est détecté, l'indicatif
 * pays par défaut (+228, Togo) est ajouté automatiquement.
 */
export function normalizeWhatsAppNumber(phone: string, countryCode = DEFAULT_COUNTRY_CODE): string {
  let digits = (phone || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  // Préfixe international "00" -> on le retire
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  // Indicatif déjà présent
  if (digits.startsWith(countryCode)) {
    return digits;
  }
  // Numéro local : on retire un éventuel 0 de tête puis on ajoute l'indicatif
  digits = digits.replace(/^0+/, '');
  return countryCode + digits;
}

/**
 * Construit le texte de la facture destiné à WhatsApp.
 */
export function buildInvoiceText(data: InvoiceData): string {
  const total = data.items.reduce(
    (sum, item) => sum + item.quantiteVendue * item.prixUnitaireVente,
    0
  );

  const lines: string[] = [];
  lines.push(`*${data.entreprise || 'Inveritas'}*`);
  lines.push('🧾 *FACTURE*');
  lines.push(`N° : ${data.numero}`);
  lines.push(`Date : ${formatDateTime(data.date)}`);
  if (data.vendeur) lines.push(`Vendeur : ${data.vendeur}`);
  if (data.clientNom) lines.push(`Client : ${data.clientNom}`);
  lines.push('');
  lines.push('-----------------------------------');
  data.items.forEach((item) => {
    const lineTotal = item.quantiteVendue * item.prixUnitaireVente;
    lines.push(
      `• ${item.libelle}\n   ${item.quantiteVendue} x ${formatCurrency(item.prixUnitaireVente)} = *${formatCurrency(lineTotal)}*`
    );
  });
  lines.push('-----------------------------------');
  lines.push(`*TOTAL : ${formatCurrency(total)}*`);
  lines.push('');
  lines.push('Merci pour votre achat 🙏');

  return lines.join('\n');
}

/**
 * Construit l'URL WhatsApp « click-to-chat » avec le message pré-rempli.
 * Si aucun numéro n'est fourni, l'utilisateur choisira le destinataire dans WhatsApp.
 */
export function buildWhatsAppInvoiceUrl(phone: string, text: string): string {
  const number = normalizeWhatsAppNumber(phone);
  const encoded = encodeURIComponent(text);
  return number
    ? `https://wa.me/${number}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
