'use client';

import React, { useState, useEffect } from 'react';
import { History, Search } from 'lucide-react';
import { TableContainer, TableHeader } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatDateShort } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export default function AuditPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const actions = [
    'CONNEXION', 'DECONNEXION', 'CREATION_ARTICLE', 'MODIFICATION_ARTICLE', 'SUPPRESSION_ARTICLE',
    'MODIFICATION_STOCK', 'CREATION_CATEGORIE', 'MODIFICATION_CATEGORIE', 'SUPPRESSION_CATEGORIE',
    'CREATION_COMMERCANT', 'MODIFICATION_COMMERCANT', 'SUPPRESSION_COMMERCANT', 'REVOCATION_COMMERCANT',
    'CREATION_ATTRIBUTION', 'MODIFICATION_ATTRIBUTION', 'ANNULATION_ATTRIBUTION', 'CLOTURE_ATTRIBUTION',
    'ENREGISTREMENT_VENTE'
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = actionFilter ? `/api/audit?action=${actionFilter}` : '/api/audit';
      const res = await fetch(url);
      if (res.ok) setLogs(await res.json());
    } catch {
      showToast('error', 'Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <>
      <div className="page-toolbar">
        <div className="toolbar-filters">
          <p className="text-muted flex-1">Consultez l'historique des actions sensibles sur le système.</p>
          <Select 
            options={[{value: '', label: 'Toutes les actions'}, ...actions.map(a => ({value: a, label: a}))]}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            containerClassName="w-64"
          />
        </div>
      </div>

      <TableContainer>
        <TableHeader title="Journal d'Audit" />
        {loading ? (
          <div className="p-8 text-center"><span className="spinner"></span></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><History size={32} /></div>
            <h3>Aucun enregistrement</h3>
          </div>
        ) : (
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Entité</th>
              <th>Détails</th>
            </tr>
          </thead>
        )}
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="whitespace-nowrap">{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
              <td>
                <div className="font-bold">{log.user?.prenom} {log.user?.nom}</div>
                <div className="text-xs text-muted">{log.user?.role}</div>
              </td>
              <td>
                <Badge variant={
                  log.action.includes('SUPPRESSION') || log.action.includes('ANNULATION') || log.action.includes('REVOCATION') ? 'danger' :
                  log.action.includes('MODIFICATION') || log.action.includes('CLOTURE') ? 'warning' :
                  log.action.includes('CREATION') || log.action.includes('ENREGISTREMENT') ? 'success' : 'info'
                }>
                  {log.action}
                </Badge>
              </td>
              <td className="font-mono text-xs">{log.entityType} ({log.entityId?.substring(0, 8)}...)</td>
              <td className="text-sm font-mono text-muted max-w-xs truncate" title={log.details ? JSON.stringify(log.details) : ''}>
                {log.details ? JSON.stringify(log.details) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </>
  );
}
