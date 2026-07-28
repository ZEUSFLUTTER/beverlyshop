'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatDateShort, getStatutBadgeClass, getStatutLabel } from '@/lib/utils';

export function ProfileSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile');
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setForm({ nom: data.nom || '', prenom: data.prenom || '', telephone: data.telephone || '' });
      }
    } catch {
      showToast('error', 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', 'Profil mis à jour');
      fetchProfile();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) {
      showToast('error', 'Les mots de passe ne correspondent pas');
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('success', 'Mot de passe modifié avec succès');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><span className="spinner"></span></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Informations personnelles */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2">
            <User className="text-primary" size={20} /> Mes informations
          </CardTitle>
        </CardHeader>

        {profile && (
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-default">
            <div className="w-14 h-14 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold text-lg border border-indigo-500/30">
              {profile.prenom?.charAt(0)}{profile.nom?.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">{profile.prenom} {profile.nom}</div>
              <div className="text-xs text-muted flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={getStatutBadgeClass(profile.statut) as any}>{getStatutLabel(profile.statut)}</Badge>
                {profile.dateEmbauche && <span>Depuis le {formatDateShort(profile.dateEmbauche)}</span>}
              </div>
            </div>
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSaveProfile}>
          <div className="form-row">
            <Input label="Prénom" required value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
            <Input label="Nom" required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
          </div>
          <Input
            label="Email (identifiant de connexion)"
            value={profile?.email || ''}
            disabled
            leftIcon={<Mail size={16} />}
          />
          <Input
            label="Numéro de téléphone"
            type="tel"
            value={form.telephone}
            onChange={e => setForm({ ...form, telephone: e.target.value })}
            leftIcon={<Phone size={16} />}
            placeholder="Ex: 90 12 34 56"
          />
          <div className="flex justify-end mt-2">
            <Button type="submit" isLoading={savingProfile} leftIcon={<Save size={18} />}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>

      {/* Changement de mot de passe */}
      <Card className="p-6 h-fit">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-primary" size={20} /> Sécurité
          </CardTitle>
        </CardHeader>

        <form className="flex flex-col gap-4" onSubmit={handleChangePassword}>
          <Input
            label="Mot de passe actuel"
            type="password"
            required
            value={pwd.currentPassword}
            onChange={e => setPwd({ ...pwd, currentPassword: e.target.value })}
            leftIcon={<Lock size={16} />}
          />
          <Input
            label="Nouveau mot de passe"
            type="password"
            required
            value={pwd.newPassword}
            onChange={e => setPwd({ ...pwd, newPassword: e.target.value })}
            leftIcon={<Lock size={16} />}
          />
          <Input
            label="Confirmer le nouveau mot de passe"
            type="password"
            required
            value={pwd.confirmPassword}
            onChange={e => setPwd({ ...pwd, confirmPassword: e.target.value })}
            leftIcon={<Lock size={16} />}
          />
          <p className="text-xs text-muted">
            Au moins 8 caractères, une majuscule, une minuscule et un chiffre.
          </p>
          <div className="flex justify-end mt-1">
            <Button type="submit" variant="secondary" isLoading={savingPwd} leftIcon={<ShieldCheck size={18} />}>
              Changer le mot de passe
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
