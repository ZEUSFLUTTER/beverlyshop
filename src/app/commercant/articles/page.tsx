'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { TableContainer, TableHeader } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';

export default function CommercantArticlesPage() {
  const { showToast } = useToast();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
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
    fetchArticles();
  }, []);

  const filtered = articles.filter(a =>
    a.libelle.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalRestant = filtered.reduce((sum, a) => sum + a.quantiteRestante, 0);
  const totalValeur = filtered.reduce((sum, a) => sum + (a.quantiteRestante * a.prixUnitaire), 0);

  return (
    <>
      <div className="page-toolbar">
        <div className="toolbar-filters">
          <Input
            placeholder="Rechercher (Code, Libellé)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
            style={{ width: '300px', marginBottom: 0 }}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="kpi-grid mb-6">
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(176,141,87,0.1)', color: 'var(--accent-primary)' }}>
            <Package size={24} />
          </div>
          <div>
            <p className="font-bold text-2xl leading-tight">{totalRestant}</p>
            <p className="text-sm text-muted font-medium">Articles en stock</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(32,201,151,0.1)', color: '#20c997' }}>
            <Eye size={24} />
          </div>
          <div>
            <p className="font-bold text-2xl leading-tight">{formatCurrency(totalValeur)}</p>
            <p className="text-sm text-muted font-medium">Valeur totale</p>
          </div>
        </div>
      </div>

      <TableContainer>
        <TableHeader title="Mes Articles Attribués" />
        {loading ? (
          <div className="p-8 text-center"><span className="spinner"></span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={32} /></div>
            <h3>Aucun article</h3>
            <p>Vous n'avez aucun article attribué pour le moment.</p>
          </div>
        ) : (
          <thead>
            <tr>
              <th>Code</th>
              <th>Libellé</th>
              <th className="text-right">Prix Unitaire</th>
              <th className="text-right">Qté Initiale</th>
              <th className="text-right">Qté Vendue</th>
              <th className="text-right">Qté Restante</th>
              <th className="text-right">Valeur Restante</th>
              <th>Statut</th>
            </tr>
          </thead>
        )}
        <tbody>
          {filtered.map((a, idx) => (
            <tr key={`${a.articleId}_${a.attributionId}_${idx}`}>
              <td className="font-mono text-muted">{a.code}</td>
              <td className="font-bold">{a.libelle}</td>
              <td className="text-right">{formatCurrency(a.prixUnitaire)}</td>
              <td className="text-right">{a.quantiteInitiale}</td>
              <td className="text-right">{a.quantiteVendue}</td>
              <td className="text-right font-bold">{a.quantiteRestante}</td>
              <td className="text-right font-bold text-accent">{formatCurrency(a.quantiteRestante * a.prixUnitaire)}</td>
              <td>
                {a.quantiteRestante <= 5 ? (
                  <Badge variant="danger">Stock Faible</Badge>
                ) : (
                  <Badge variant="success">En Stock</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </>
  );
}
