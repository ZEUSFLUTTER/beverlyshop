import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateTime } from './utils';
import type { InvoiceData } from './invoice';

/** Formatage monétaire simple compatible PDF (espaces classiques). */
function money(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} FCFA`;
}

/**
 * Génère une vraie facture PDF et la retourne sous forme de Blob + document jsPDF.
 */
export function buildInvoicePdf(data: InvoiceData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 15;
  const accent: [number, number, number] = [176, 141, 87]; // or Inveritas

  const total = data.items.reduce(
    (s, i) => s + i.quantiteVendue * i.prixUnitaireVente,
    0
  );

  // ---- En-tête ----
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(data.entreprise || 'Inveritas', marginX, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Gestion de stock & ventes', marginX, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FACTURE', pageWidth - marginX, 18, { align: 'right' });

  // ---- Métadonnées ----
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let y = 44;
  doc.text(`N° de facture : ${data.numero}`, marginX, y);
  y += 6;
  doc.text(`Date : ${formatDateTime(data.date)}`, marginX, y);
  if (data.vendeur) {
    y += 6;
    doc.text(`Vendeur : ${data.vendeur}`, marginX, y);
  }

  // Bloc client (à droite)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Facturé à', pageWidth - marginX, 44, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(data.clientNom || 'Client', pageWidth - marginX, 50, { align: 'right' });

  // ---- Tableau des articles ----
  autoTable(doc, {
    startY: Math.max(y, 56) + 6,
    head: [['Article', 'Qté', 'Prix unitaire', 'Montant']],
    body: data.items.map((item) => [
      item.libelle,
      String(item.quantiteVendue),
      money(item.prixUnitaireVente),
      money(item.quantiteVendue * item.prixUnitaireVente),
    ]),
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: accent, textColor: [255, 255, 255], halign: 'left' },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    margin: { left: marginX, right: marginX },
  });

  // ---- Total ----
  const finalY = (doc as any).lastAutoTable?.finalY || 80;
  const boxW = 70;
  const boxX = pageWidth - marginX - boxW;
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(boxX, finalY + 6, boxW, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL', boxX + 4, finalY + 14);
  doc.text(money(total), boxX + boxW - 4, finalY + 14, { align: 'right' });

  // ---- Pied de page ----
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Merci pour votre achat. Facture générée par Inveritas.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 12,
    { align: 'center' }
  );

  return doc;
}

/** Télécharge la facture PDF. */
export function downloadInvoicePdf(data: InvoiceData): void {
  const doc = buildInvoicePdf(data);
  doc.save(`Facture-${data.numero}.pdf`);
}

/** Ouvre la facture PDF dans un nouvel onglet (aperçu / impression). */
export function openInvoicePdf(data: InvoiceData): void {
  const doc = buildInvoicePdf(data);
  const url = doc.output('bloburl');
  window.open(url, '_blank');
}

/** Retourne la facture PDF sous forme de fichier (pour le partage natif / WhatsApp). */
export function getInvoicePdfFile(data: InvoiceData): File {
  const doc = buildInvoicePdf(data);
  const blob = doc.output('blob');
  return new File([blob], `Facture-${data.numero}.pdf`, { type: 'application/pdf' });
}
