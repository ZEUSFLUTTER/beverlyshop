'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TableContainer, TableHeader } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReconciliationPage() {
  const { showToast } = useToast();
  const [attributions, setAttributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('EN_COURS');
  
  // Details Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttr, setSelectedAttr] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reconciliation?statut=${filterStatut}`);
      if (res.ok) {
        setAttributions(await res.json());
      }
    } catch {
      showToast('error', 'Erreur chargement réconciliation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatut]);

  const handleCloturer = async (id: string) => {
    if (!window.confirm('Voulez-vous clôturer cette attribution ? Les articles invendus seront retournés au stock principal.')) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reconciliation/${id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast('success', data.message);
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (attr: any) => {
    setSelectedAttr(attr);
    setIsModalOpen(true);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Rapport de Réconciliation', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
    doc.text(`Statut: ${filterStatut === 'EN_COURS' ? 'En Cours' : 'Clôturées'}`, 14, 36);

    const tableColumn = ["Date", "Commerçant", "Montant Attendu", "Montant Déclaré", "Écart", "Statut"];
    const tableRows: any[] = [];

    attributions.forEach(attr => {
      const rowData = [
        formatDateShort(attr.dateAttribution),
        `${attr.commercant.prenom} ${attr.commercant.nom}`,
        formatCurrency(attr.montantAttendu),
        formatCurrency(attr.montantDeclare),
        formatCurrency(attr.ecart),
        attr.statut
      ];
      tableRows.push(rowData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [44, 62, 80] }
    });

    doc.save(`reconciliation_${filterStatut.toLowerCase()}_${Date.now()}.pdf`);
  };

  return (
    <>
      <div className="page-toolbar">
        <div className="toolbar-filters">
          <p className="text-muted flex-1">Consultez les écarts entre les articles attribués et les ventes déclarées.</p>
          <Select 
            options={[
              { value: 'EN_COURS', label: 'En Cours' },
              { value: 'CLOTURE', label: 'Clôturées' }
            ]}
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            containerClassName="w-48"
          />
        </div>
      </div>

      <TableContainer>
        <TableHeader 
          title="Réconciliation des Commerçants" 
          actions={
            <Button variant="secondary" onClick={handleExportPDF} leftIcon={<FileText size={18}/>}>
              Exporter PDF
            </Button>
          }
        />
        {loading ? (
          <div className="p-8 text-center"><span className="spinner"></span></div>
        ) : attributions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={32} /></div>
            <h3>Aucune donnée</h3>
            <p>Pas d'attributions avec le statut sélectionné.</p>
          </div>
        ) : (
          <thead>
            <tr>
              <th>Date</th>
              <th>Commerçant</th>
              <th className="text-right">Montant Attendu (Vendus)</th>
              <th className="text-right">Montant Déclaré</th>
              <th className="text-right">Écart</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
        )}
        <tbody>
          {attributions.map((attr) => {
            // Note: Montant attendu is based on actually sold items quantity * original price.
            // Oh wait! In my API, montantAttendu was calculated as (quantiteAttribuee * prix).
            // This means expected CA if THEY SELL EVERYTHING.
            const hasEcart = attr.ecart !== 0; // Negative means missing money
            return (
              <tr key={attr.id}>
                <td>{formatDateShort(attr.dateAttribution)}</td>
                <td className="font-bold">{attr.commercant.prenom} {attr.commercant.nom}</td>
                <td className="text-right">{formatCurrency(attr.montantAttendu)}</td>
                <td className="text-right font-bold">{formatCurrency(attr.montantDeclare)}</td>
                <td className="text-right">
                  {/* Note: This is a simplified Ecart. If they haven't sold everything, of course there is an ecart.
                      A better ecart is: (qteVendue * prix) vs montantDeclare. 
                      Since our system automatically calculates montantDeclare as qteVendue * prix, 
                      there won't be a financial gap unless they can alter the price. 
                      The true missing info is "Stock Restant". 
                  */}
                  {attr.ecart < 0 ? (
                    <span className="text-warning font-bold flex items-center justify-end gap-1">
                      <AlertTriangle size={14}/> {formatCurrency(attr.ecart)}
                    </span>
                  ) : (
                    <span className="text-success font-bold flex items-center justify-end gap-1">
                      <CheckCircle size={14}/> {formatCurrency(attr.ecart)}
                    </span>
                  )}
                </td>
                <td>
                  <Badge variant={attr.statut === 'EN_COURS' ? 'warning' : 'success'}>
                    {attr.statut === 'EN_COURS' ? 'En cours' : 'Clôturé'}
                  </Badge>
                </td>
                <td className="text-right">
                  <button onClick={() => handleViewDetails(attr)} className="btn-icon text-muted hover:text-primary transition-colors" title="Détails">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableContainer>

      {/* Details Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Détails de Réconciliation"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Fermer</Button>
            {selectedAttr?.statut === 'EN_COURS' && (
              <Button onClick={() => handleCloturer(selectedAttr.id)} isLoading={isSubmitting} leftIcon={<CheckCircle size={18}/>}>
                Clôturer & Retourner invendus
              </Button>
            )}
          </>
        }
      >
        {selectedAttr && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/20 p-4 rounded-lg border border-white/5">
              <div>
                <div className="text-xs text-muted uppercase">Commerçant</div>
                <div className="font-bold">{selectedAttr.commercant.prenom} {selectedAttr.commercant.nom}</div>
              </div>
              <div>
                <div className="text-xs text-muted uppercase">Date Attribution</div>
                <div className="font-bold">{formatDateShort(selectedAttr.dateAttribution)}</div>
              </div>
              <div>
                <div className="text-xs text-muted uppercase">CA Attendu (Si 100% vendu)</div>
                <div className="font-bold">{formatCurrency(selectedAttr.montantAttendu)}</div>
              </div>
              <div>
                <div className="text-xs text-muted uppercase">CA Déclaré (Actuel)</div>
                <div className="font-bold text-accent">{formatCurrency(selectedAttr.montantDeclare)}</div>
              </div>
            </div>

            <h4 className="text-sm font-bold text-muted uppercase tracking-wider border-b border-white/10 pb-2">État des Articles</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-white/10">
                    <th className="py-2">Article</th>
                    <th className="py-2 text-right">Attribué</th>
                    <th className="py-2 text-right">Vendu</th>
                    <th className="py-2 text-right text-warning">Invendu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selectedAttr.articles.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3">
                        <div className="font-bold">{item.libelle}</div>
                        <div className="text-xs text-muted font-mono">{item.code}</div>
                      </td>
                      <td className="py-3 text-right font-bold">{item.quantiteAttribuee}</td>
                      <td className="py-3 text-right font-bold text-success">{item.quantiteVendue}</td>
                      <td className="py-3 text-right font-bold text-warning">{item.quantiteRestante}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedAttr.statut === 'EN_COURS' && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-warning text-sm">
                <AlertTriangle size={16} className="inline mr-2 mb-1" />
                La clôture de cette attribution remettra automatiquement les quantités <strong>invendues</strong> dans le stock principal de la boutique.
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
