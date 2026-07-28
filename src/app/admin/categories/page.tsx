'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TableContainer, TableHeader } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCat, setCurrentCat] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ nom: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (res.ok) setCategories(data);
    } catch {
      showToast('error', 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (cat?: any) => {
    if (cat) {
      setCurrentCat(cat);
      setFormData({ nom: cat.nom, description: cat.description || '' });
    } else {
      setCurrentCat(null);
      setFormData({ nom: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = currentCat ? `/api/categories/${currentCat.id}` : '/api/categories';
      const method = currentCat ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast('success', currentCat ? 'Catégorie modifiée' : 'Catégorie créée');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      showToast('success', 'Catégorie supprimée');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  return (
    <>
      <TableContainer>
        <TableHeader 
          title="Gestion des Catégories" 
          actions={
            <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
              Nouvelle Catégorie
            </Button>
          }
        />
        {loading ? (
          <div className="p-8 text-center"><span className="spinner"></span></div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Tag size={32} /></div>
            <h3>Aucune catégorie</h3>
          </div>
        ) : (
          <thead>
            <tr>
              <th>Nom de la catégorie</th>
              <th>Description</th>
              <th className="text-center">Nb d'Articles</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
        )}
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td className="font-bold">{cat.nom}</td>
              <td className="text-muted">{cat.description || '-'}</td>
              <td className="text-center font-bold text-lg">{cat._count?.articles || 0}</td>
              <td className="text-right">
                <button onClick={() => handleOpenModal(cat)} className="btn-icon text-muted hover:text-primary transition-colors">
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)} 
                  className="btn-icon text-muted hover:text-danger transition-colors"
                  disabled={cat._count?.articles > 0}
                  style={{ opacity: cat._count?.articles > 0 ? 0.3 : 1, cursor: cat._count?.articles > 0 ? 'not-allowed' : 'pointer' }}
                  title={cat._count?.articles > 0 ? "Impossible de supprimer (contient des articles)" : "Supprimer"}
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableContainer>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={currentCat ? 'Modifier la catégorie' : 'Nouvelle Catégorie'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>Enregistrer</Button>
          </>
        }
      >
        <form className="flex-col gap-4">
          <Input 
            label="Nom" 
            required 
            value={formData.nom} 
            onChange={e => setFormData({...formData, nom: e.target.value})} 
            placeholder="Ex: Stylos & Crayons"
          />
          <div className="form-group w-full">
            <label className="form-label">Description (Optionnel)</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Brève description de la catégorie..."
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
