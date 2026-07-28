'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Phone, Mail, Lock, KeyRound, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TableContainer, TableHeader } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatDateShort, getStatutBadgeClass, getStatutLabel } from '@/lib/utils';

export default function CommercantsPage() {
  const { showToast } = useToast();
  const [commercants, setCommercants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [currentCommercant, setCurrentCommercant] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [copied, setCopied] = useState(false);

  // Form states — prénom, nom, email, téléphone (+ statut en modification)
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    telephone: '',
    statut: 'ACTIF'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/commercants');
      const data = await res.json();
      if (res.ok) setCommercants(data);
    } catch {
      showToast('error', 'Erreur lors du chargement des commerçants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (commercant?: any) => {
    if (commercant) {
      setCurrentCommercant(commercant);
      setFormData({
        email: commercant.email,
        nom: commercant.nom,
        prenom: commercant.prenom,
        telephone: commercant.telephone || '',
        statut: commercant.statut
      });
    } else {
      setCurrentCommercant(null);
      setFormData({ email: '', nom: '', prenom: '', telephone: '', statut: 'ACTIF' });
    }
    setGeneratedPassword('');
    setGeneratedEmail('');
    setCopied(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prenom.trim() || !formData.nom.trim()) {
      showToast('error', 'Le prénom et le nom sont obligatoires');
      return;
    }

    if (!formData.email.trim()) {
      showToast('error', "L'email est obligatoire pour la connexion du commerçant");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = currentCommercant ? `/api/commercants/${currentCommercant.id}` : '/api/commercants';
      const method = currentCommercant ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.tempPassword) {
        setGeneratedPassword(data.tempPassword);
        setGeneratedEmail(data.email || '');
        showToast('success', 'Commerçant créé', 'Communiquez les identifiants de connexion.');
      } else {
        showToast('success', 'Commerçant modifié');
        setIsModalOpen(false);
      }

      fetchData();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ou révoquer ce commerçant ?')) return;

    try {
      const res = await fetch(`/api/commercants/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      showToast('success', data.message || 'Opération réussie');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const handleResetPassword = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/commercants/${currentCommercant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetPassword: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGeneratedPassword(data.tempPassword);
      showToast('success', 'Mot de passe réinitialisé');
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    const text = generatedEmail
      ? `Identifiant : ${generatedEmail}\nMot de passe : ${generatedPassword}`
      : generatedPassword;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <TableContainer>
        <TableHeader
          title="Liste des Commerçants"
          actions={
            <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
              Nouveau Commerçant
            </Button>
          }
        />
        {loading ? (
          <div className="p-8 text-center"><span className="spinner"></span></div>
        ) : commercants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={32} /></div>
            <h3>Aucun commerçant</h3>
            <p>Ajoutez des commerçants pour leur attribuer des articles.</p>
          </div>
        ) : (
          <thead>
            <tr>
              <th>Nom & Prénom</th>
              <th>Téléphone</th>
              <th>Date d'embauche</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
        )}
        <tbody>
          {commercants.map((c) => (
            <tr key={c.id}>
              <td className="font-bold">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                    {c.prenom.charAt(0)}{c.nom.charAt(0)}
                  </div>
                  <div>
                    <div>{c.prenom} {c.nom}</div>
                    <div className="text-xs text-muted font-normal mt-0.5">{c.email}</div>
                  </div>
                </div>
              </td>
              <td className="text-muted">
                <span className="flex items-center gap-2">
                  <Phone size={14} /> {c.telephone || '-'}
                </span>
              </td>
              <td>{formatDateShort(c.dateEmbauche)}</td>
              <td>
                <Badge variant={getStatutBadgeClass(c.statut) as any}>{getStatutLabel(c.statut)}</Badge>
              </td>
              <td className="text-right">
                <button
                  onClick={() => {
                    setCurrentCommercant(c);
                    setGeneratedPassword('');
                    setGeneratedEmail('');
                    setIsResetModalOpen(true);
                  }}
                  className="btn-icon text-muted hover:text-warning transition-colors"
                  title="Réinitialiser MDP"
                >
                  <KeyRound size={18} />
                </button>
                <button onClick={() => handleOpenModal(c)} className="btn-icon text-muted hover:text-primary transition-colors" title="Modifier">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="btn-icon text-muted hover:text-danger transition-colors" title="Supprimer/Révoquer">
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableContainer>

      {/* Main Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentCommercant ? 'Modifier le commerçant' : 'Nouveau Commerçant'}
        footer={
          !generatedPassword ? (
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit} isLoading={isSubmitting}>Enregistrer</Button>
            </>
          ) : (
            <Button onClick={() => setIsModalOpen(false)}>Fermer</Button>
          )
        }
      >
        {generatedPassword ? (
          <div className="text-center p-2 sm:p-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Commerçant créé avec succès</h3>
            <p className="text-muted mb-6">Communiquez ces identifiants au commerçant. Il devra changer son mot de passe à la première connexion.</p>

            <div className="flex flex-col gap-3 text-left">
              {generatedEmail && (
                <div className="bg-black/5 border border-border-default rounded-lg p-3">
                  <div className="text-xs text-muted uppercase tracking-wider mb-1">Identifiant de connexion</div>
                  <div className="font-mono text-base font-bold break-all">{generatedEmail}</div>
                </div>
              )}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <div className="text-xs text-muted uppercase tracking-wider mb-1">Mot de passe temporaire</div>
                <div className="font-mono text-xl font-bold text-emerald-600 tracking-wider break-all">{generatedPassword}</div>
              </div>
            </div>

            <Button
              variant="secondary"
              className="mt-4 w-full"
              leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
              onClick={handleCopyCredentials}
            >
              {copied ? 'Copié !' : 'Copier les identifiants'}
            </Button>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="form-row">
              <Input label="Prénom" required value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} />
              <Input label="Nom" required value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} />
            </div>
            <Input
              label="Email (identifiant de connexion)"
              type="email"
              required
              disabled={!!currentCommercant}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              leftIcon={<Mail size={16} />}
              placeholder="commercant@exemple.com"
            />
            <Input
              label="Numéro de téléphone"
              type="tel"
              value={formData.telephone}
              onChange={e => setFormData({ ...formData, telephone: e.target.value })}
              leftIcon={<Phone size={16} />}
              placeholder="Ex: 90 12 34 56"
            />

            {!currentCommercant && (
              <p className="text-xs text-muted bg-black/5 border border-border-default rounded-lg p-3">
                Le commerçant se connectera avec cet email. Un mot de passe temporaire sera généré à l'enregistrement.
              </p>
            )}

            {currentCommercant && (
              <div className="form-group w-full mb-0">
                <label className="form-label">Statut</label>
                <select
                  className="form-select w-full"
                  value={formData.statut}
                  onChange={e => setFormData({ ...formData, statut: e.target.value })}
                >
                  <option value="ACTIF">Actif</option>
                  <option value="SUSPENDU">Suspendu</option>
                  <option value="REVOQUE">Révoqué</option>
                </select>
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Réinitialiser le mot de passe"
        footer={
          !generatedPassword ? (
            <>
              <Button variant="ghost" onClick={() => setIsResetModalOpen(false)}>Annuler</Button>
              <Button onClick={handleResetPassword} variant="danger" isLoading={isSubmitting}>Confirmer la réinitialisation</Button>
            </>
          ) : (
            <Button onClick={() => setIsResetModalOpen(false)}>Fermer</Button>
          )
        }
      >
        {generatedPassword ? (
          <div className="text-center p-2 sm:p-6">
            <h3 className="text-xl font-bold mb-2">Mot de passe réinitialisé</h3>
            <p className="text-muted mb-6">Voici le nouveau mot de passe temporaire pour {currentCommercant?.prenom}.</p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4 font-mono text-2xl text-amber-600 tracking-wider break-all">
              {generatedPassword}
            </div>
          </div>
        ) : (
          <div className="p-2">
            <p>Êtes-vous sûr de vouloir réinitialiser le mot de passe de <strong>{currentCommercant?.prenom} {currentCommercant?.nom}</strong> ?</p>
            <p className="text-muted mt-2 text-sm">Un nouveau mot de passe temporaire sera généré et le commerçant devra le changer à sa prochaine connexion.</p>
          </div>
        )}
      </Modal>
    </>
  );
}
