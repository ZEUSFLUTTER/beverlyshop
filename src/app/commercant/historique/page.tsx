'use client';

import React, { useState, useEffect } from 'react';
import { TableContainer, TableHeader } from '@/components/ui/Table';
import { History } from 'lucide-react';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function HistoriqueVentesPage() {
  const { showToast } = useToast();
  const [ventes, setVentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVentes = async () => {
      try {
        const res = await fetch('/api/ventes');
        if (res.ok) {
          setVentes(await res.json());
        }
      } catch {
        showToast('error', 'Erreur lors du chargement de l\'historique');
      } finally {
        setLoading(false);
      }
    };

    fetchVentes();
  }, []);

  const totalVentes = ventes.reduce((sum, v) => sum + parseFloat(v.montantTotal), 0);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-white/10 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-muted">Total de vos ventes</h2>
          <p className="text-3xl font-bold text-accent">{formatCurrency(totalVentes)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">Nombre d'opérations: {ventes.length}</p>
        </div>
      </div>

      <TableContainer>
        <TableHeader title="Historique Détaillé" />
        {loading ? (
          <div className="p-8 text-center"><span className="spinner"></span></div>
        ) : ventes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><History size={32} /></div>
            <h3>Aucune vente</h3>
            <p>Vos ventes apparaîtront ici.</p>
          </div>
        ) : (
          <thead>
            <tr>
              <th>Date</th>
              <th>Code Article</th>
              <th>Libellé</th>
              <th className="text-right">Quantité</th>
              <th className="text-right">Prix Unit.</th>
              <th className="text-right">Montant Total</th>
            </tr>
          </thead>
        )}
        <tbody>
          {ventes.map((v) => (
            <tr key={v.id}>
              <td>{formatDateShort(v.dateVente)}</td>
              <td className="font-mono text-muted">{v.article.code}</td>
              <td className="font-bold">{v.article.libelle}</td>
              <td className="text-right">{v.quantiteVendue}</td>
              <td className="text-right">{formatCurrency(v.prixUnitaireVente)}</td>
              <td className="text-right font-bold text-accent">{formatCurrency(v.montantTotal)}</td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </div>
  );
}
