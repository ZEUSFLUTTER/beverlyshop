'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, Package, MessageCircle, User, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import {
  generateInvoiceNumber,
  buildInvoiceText,
  buildWhatsAppInvoiceUrl,
  InvoiceData,
} from '@/lib/invoice';
import { downloadInvoicePdf, openInvoicePdf, getInvoicePdfFile } from '@/lib/invoicePdf';
import { Download, Eye } from 'lucide-react';

export default function VentesPage() {
  const { showToast } = useToast();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerName, setSellerName] = useState('');

  // Sale quantities: {[articleId_attributionId]: { quantite: number, prix: number, articleInfo: any }}
  const [cart, setCart] = useState<Record<string, any>>({});

  // Infos client (facture WhatsApp)
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');

  // Modal facture après validation
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<InvoiceData | null>(null);
  const [invoicePhone, setInvoicePhone] = useState('');

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/commercant/articles');
      if (res.ok) {
        setArticles(await res.json());
      }
    } catch {
      showToast('error', 'Erreur chargement articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) setSellerName(`${data.user.prenom} ${data.user.nom}`);
      })
      .catch(() => {});
  }, []);

  const handleUpdateCart = (article: any, qtyStr: string) => {
    const qty = parseInt(qtyStr) || 0;
    const key = `${article.articleId}_${article.attributionId}`;

    if (qty <= 0) {
      const newCart = { ...cart };
      delete newCart[key];
      setCart(newCart);
      return;
    }

    // Max quantity constraint
    const finalQty = Math.min(qty, article.quantiteRestante);

    setCart({
      ...cart,
      [key]: {
        attributionId: article.attributionId,
        articleId: article.articleId,
        quantiteVendue: finalQty,
        prixUnitaireVente: article.prixUnitaire,
        libelle: article.libelle
      }
    });
  };

  const calculateTotal = () => {
    return Object.values(cart).reduce((sum, item) => sum + (item.quantiteVendue * item.prixUnitaireVente), 0);
  };

  const handleSubmit = async () => {
    const items = Object.values(cart);
    if (items.length === 0) {
      showToast('error', 'Veuillez saisir au moins une vente');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ventes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('success', 'Ventes enregistrées avec succès !');

      // Prépare la facture pour l'envoi WhatsApp
      const invoice: InvoiceData = {
        numero: generateInvoiceNumber(),
        date: new Date(),
        vendeur: sellerName,
        clientNom: clientNom.trim() || undefined,
        items: items.map((item: any) => ({
          libelle: item.libelle,
          quantiteVendue: item.quantiteVendue,
          prixUnitaireVente: item.prixUnitaireVente,
        })),
      };
      setLastInvoice(invoice);
      setInvoicePhone(clientTelephone);
      setInvoiceModalOpen(true);

      // Réinitialise le panier et les infos client
      setCart({});
      setClientNom('');
      setClientTelephone('');
      fetchArticles(); // Refresh available quantities
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (lastInvoice === null) return;
    const invoice = lastInvoice;
    const text = buildInvoiceText(invoice);

    // 1) Mobile : partage natif du fichier PDF -> l'utilisateur choisit WhatsApp, le PDF est joint
    try {
      const file = getInvoicePdfFile(invoice);
      const nav = navigator as any;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({
            files: [file],
            title: `Facture ${invoice.numero}`,
            text,
          });
        } catch {
          // Partage annulé par l'utilisateur : ne rien faire
        }
        return;
      }
    } catch {
      // Génération/partage non supporté : on bascule sur le lien texte
    }

    // 2) Repli (ordinateur / navigateur sans partage de fichier) : lien wa.me avec le texte
    const url = buildWhatsAppInvoiceUrl(invoicePhone, text);
    window.open(url, '_blank');
  };

  const handleDownloadPdf = () => {
    if (lastInvoice) downloadInvoicePdf(lastInvoice);
  };

  const handlePreviewPdf = () => {
    if (lastInvoice) openInvoicePdf(lastInvoice);
  };

  const invoiceTotal = lastInvoice
    ? lastInvoice.items.reduce((s, i) => s + i.quantiteVendue * i.prixUnitaireVente, 0)
    : 0;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${Object.keys(cart).length > 0 ? 'has-mobile-bottom-bar' : ''}`}>
      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package size={24} className="text-primary" />
          Vos articles disponibles
        </h2>

        {loading ? (
          <div className="p-8 text-center"><span className="spinner"></span></div>
        ) : articles.length === 0 ? (
          <div className="empty-state">
            <p>Vous n'avez aucun article disponible à la vente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {articles.map((article) => {
              const key = `${article.articleId}_${article.attributionId}`;
              const cartItem = cart[key];

              return (
                <Card key={key} className="p-4 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-lg mb-1">{article.libelle}</div>
                    <div className="text-sm text-muted font-mono mb-2">{article.code}</div>
                    <div className="text-xl text-accent font-bold mb-4">{formatCurrency(article.prixUnitaire)}</div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                    <div className="text-sm">
                      Dispo: <span className="font-bold text-lg">{article.quantiteRestante}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted">Qté vendue:</label>
                      <input
                        type="number"
                        min="0"
                        max={article.quantiteRestante}
                        className="form-input text-center w-20 py-1"
                        value={cartItem?.quantiteVendue || ''}
                        onChange={(e) => handleUpdateCart(article, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <Card className={`sticky top-6 ${Object.keys(cart).length > 0 ? 'mobile-sticky-bottom' : ''}`}>
          <CardHeader className="hidden md:flex">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart size={20} /> Résumé
            </CardTitle>
          </CardHeader>

          {/* Mobile Header indicator */}
          <div className="md:hidden w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

          <div className="p-4 pt-0">
            {Object.keys(cart).length === 0 ? (
              <p className="text-muted text-sm text-center py-8 border border-dashed border-white/10 rounded-lg hidden md:block">
                Saisissez des quantités pour commencer
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <ul className="divide-y divide-white/10 max-h-40 md:max-h-64 overflow-y-auto pr-2">
                  {Object.values(cart).map((item, idx) => (
                    <li key={idx} className="py-2 flex justify-between text-sm">
                      <div>
                        <div className="font-bold">{item.libelle}</div>
                        <div className="text-muted text-xs">{item.quantiteVendue} x {formatCurrency(item.prixUnitaireVente)}</div>
                      </div>
                      <div className="font-bold">
                        {formatCurrency(item.quantiteVendue * item.prixUnitaireVente)}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-white/20 pt-4 flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-accent">{formatCurrency(calculateTotal())}</span>
                </div>

                {/* Infos client pour la facture WhatsApp */}
                <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <MessageCircle size={14} className="text-emerald-500" /> Facture client (optionnel)
                  </div>
                  <Input
                    placeholder="Nom du client"
                    value={clientNom}
                    onChange={e => setClientNom(e.target.value)}
                    leftIcon={<User size={16} />}
                  />
                  <Input
                    type="tel"
                    placeholder="Numéro WhatsApp (ex: 90 12 34 56)"
                    value={clientTelephone}
                    onChange={e => setClientTelephone(e.target.value)}
                    leftIcon={<Phone size={16} />}
                  />
                </div>

                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle size={20} />}
                  style={{ borderRadius: '99px' }}
                >
                  Valider les ventes
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal Facture / Envoi WhatsApp */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Vente enregistrée"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInvoiceModalOpen(false)}>Fermer</Button>
            <Button
              variant="success"
              onClick={handleSendWhatsApp}
              leftIcon={<MessageCircle size={18} />}
            >
              Envoyer sur WhatsApp
            </Button>
          </>
        }
      >
        {lastInvoice && (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={30} />
              </div>
              <p className="text-muted text-sm">
                Envoyez la facture au client via WhatsApp. Vous pourrez vérifier le message avant l'envoi.
              </p>
            </div>

            {/* Aperçu de la facture */}
            <div className="bg-black/5 border border-border-default rounded-lg p-4 text-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold">Facture {lastInvoice.numero}</div>
              </div>
              {lastInvoice.clientNom && (
                <div className="text-muted mb-2">Client : {lastInvoice.clientNom}</div>
              )}
              <ul className="divide-y divide-border-default">
                {lastInvoice.items.map((item, idx) => (
                  <li key={idx} className="py-2 flex justify-between gap-3">
                    <span>{item.libelle} <span className="text-muted">x{item.quantiteVendue}</span></span>
                    <span className="font-semibold whitespace-nowrap">
                      {formatCurrency(item.quantiteVendue * item.prixUnitaireVente)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-bold text-base border-t border-border-default pt-2 mt-1">
                <span>Total</span>
                <span className="text-accent">{formatCurrency(invoiceTotal)}</span>
              </div>
            </div>

            {/* Numéro WhatsApp du destinataire */}
            <Input
              label="Numéro WhatsApp du client"
              type="tel"
              value={invoicePhone}
              onChange={e => setInvoicePhone(e.target.value)}
              leftIcon={<Phone size={16} />}
              placeholder="Ex: 90 12 34 56"
            />
            <p className="text-xs text-muted -mt-2">
              L'indicatif +228 (Togo) est ajouté automatiquement. Laissez vide pour choisir le contact dans WhatsApp.
            </p>

            {/* Actions facture PDF */}
            <div className="flex flex-col sm:flex-row gap-2 border-t border-border-default pt-4">
              <Button variant="secondary" className="flex-1" onClick={handlePreviewPdf} leftIcon={<Eye size={16} />}>
                Aperçu / Imprimer
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleDownloadPdf} leftIcon={<Download size={16} />}>
                Télécharger la facture PDF
              </Button>
            </div>
            <p className="text-xs text-muted -mt-1">
              Sur mobile, « Envoyer sur WhatsApp » joint directement le PDF (choisissez le contact). Sur ordinateur, un message texte est envoyé ; utilisez alors « Télécharger » puis joignez le PDF.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
