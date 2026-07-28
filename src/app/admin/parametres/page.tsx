'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { ProfileSettings } from '@/components/settings/ProfileSettings';

export default function ParametresPage() {
  const { showToast } = useToast();
  const [parametres, setParametres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parametres');
      if (res.ok) setParametres(await res.json());
    } catch {
      showToast('error', 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (cle: string, valeur: string) => {
    setParametres(parametres.map(p => p.cle === cle ? { ...p, valeur } : p));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/parametres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parametres: parametres.map(p => ({ cle: p.cle, valeur: p.valeur })) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast('success', 'Paramètres enregistrés avec succès');
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profil de l'administrateur */}
      <section>
        <h2 className="text-lg font-bold mb-4">Mon compte</h2>
        <ProfileSettings />
      </section>

      {/* Paramètres globaux */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Configuration de l'application</h2>
          <Button onClick={handleSave} isLoading={isSubmitting} leftIcon={<Save size={18} />}>
            Enregistrer
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <Settings className="text-primary" size={20} />
              Configuration Générale
            </CardTitle>
          </CardHeader>
          
          {loading ? (
            <div className="p-8 text-center"><span className="spinner"></span></div>
          ) : (
            <div className="space-y-6">
              {parametres.map(param => (
                <div key={param.cle} className="border-b border-white/5 pb-4 last:border-0">
                  <Input 
                    label={param.cle.replace(/_/g, ' ').toUpperCase()} 
                    value={param.valeur}
                    onChange={(e) => handleChange(param.cle, e.target.value)}
                  />
                  {param.description && (
                    <p className="text-xs text-muted mt-1">{param.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 border-l-4 border-warning bg-warning/5 h-fit">
          <h3 className="text-lg font-bold text-warning mb-2 flex items-center gap-2">
            <AlertTriangle size={20} /> Attention
          </h3>
          <p className="text-sm text-muted">
            La modification de ces paramètres affecte le comportement global du système pour tous les utilisateurs.
          </p>
          <ul className="list-disc list-inside text-sm text-muted mt-4 space-y-2">
            <li><strong>COMMISSION_POURCENT :</strong> Utilisé (si implémenté) pour calculer la part du commerçant.</li>
            <li><strong>SEUIL_ECART_ALERTE :</strong> Définit le niveau de tolérance lors de la réconciliation.</li>
            <li><strong>MONNAIE :</strong> Affecte l'affichage de toutes les valeurs monétaires.</li>
          </ul>
        </Card>
        </div>
      </section>
    </div>
  );
}
