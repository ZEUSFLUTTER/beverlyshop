'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TableContainer, TableHeader } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, getStockLevel } from '@/lib/utils';

export default function StockPage() {
  const { showToast } = useToast();
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    categorieId: '',
    prixUnitaire: '',
    quantiteStock: '',
    seuilAlerte: '5'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [artRes, catRes] = await Promise.all([
        fetch(`/api/articles?search=${search}&categorieId=${categorieFilter}`),
        fetch('/api/categories')
      ]);
      
      const artData = await artRes.json();
      const catData = await catRes.json();
      
      if (artRes.ok) setArticles(artData);
      if (catRes.ok) setCategories(catData);
    } catch (error) {
      showToast('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, categorieFilter]);

  const handleOpenModal = (article?: any) => {
    if (article) {
      setCurrentArticle(article);
      setFormData({
        code: article.code,
        libelle: article.libelle,
        categorieId: article.categorieId,
        prixUnitaire: article.prixUnitaire.toString(),
        quantiteStock: article.quantiteStock.toString(),
        seuilAlerte: article.seuilAlerte.toString()
      });
    } else {
      setCurrentArticle(null);
      setFormData({
        code: '',
        libelle: '',
        categorieId: '',
        prixUnitaire: '',
        quantiteStock: '',
        seuilAlerte: '5'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = currentArticle ? `/api/articles/${currentArticle.id}` : '/api/articles';
      const method = currentArticle ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erreur');
      
      showToast('success', currentArticle ? 'Article modifié' : 'Article créé avec succès');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet article ?')) return;
    
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      showToast('success', 'Article supprimé');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

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
          <Select 
            options={categories.map(c => ({ value: c.id, label: c.nom }))}
            value={categorieFilter}
            onChange={(e) => setCategorieFilter(e.target.value)}
            style={{ width: '250px', marginBottom: 0 }}
          />
          {categorieFilter && (
            <Button variant="ghost" onClick={() => setCategorieFilter('')}>Effacer filtre</Button>
          )}
        </div>
      </div>

      <TableContainer>
        <TableHeader 
          title="Inventaire des articles" 
          actions={
            <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
              Nouvel Article
            </Button>
          }
        />
        {loading ? (
          <div className="p-8 text-center"><span className="spinner"></span></div>
        ) : articles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={32} /></div>
            <h3>Aucun article trouvé</h3>
            <p>Commencez par ajouter des articles au stock.</p>
          </div>
        ) : (
          <thead>
            <tr>
              <th>Code</th>
              <th>Libellé</th>
              <th>Catégorie</th>
              <th>Prix Unit.</th>
              <th>Stock</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
        )}
        <tbody>
          {articles.map((article) => {
            const level = getStockLevel(article.quantiteStock, article.seuilAlerte);
            return (
              <tr key={article.id}>
                <td className="font-mono font-bold text-accent">{article.code}</td>
                <td className="font-bold">{article.libelle}</td>
                <td>{article.categorie.nom}</td>
                <td>{formatCurrency(article.prixUnitaire)}</td>
                <td className="font-bold text-lg">{article.quantiteStock}</td>
                <td>
                  {level === 'high' ? <Badge variant="success">En stock</Badge> :
                   level === 'medium' ? <Badge variant="warning">Faible</Badge> :
                   <Badge variant="danger">Critique</Badge>}
                </td>
                <td className="text-right">
                  <button onClick={() => handleOpenModal(article)} className="btn-icon text-muted hover:text-primary transition-colors" title="Modifier">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(article.id)} className="btn-icon text-muted hover:text-danger transition-colors" title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableContainer>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={currentArticle ? 'Modifier l\'article' : 'Nouvel Article'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>Enregistrer</Button>
          </>
        }
      >
        <form className="flex-col gap-4">
          <div className="form-row">
            <Input label="Code Article" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
            <Select label="Catégorie" required options={categories.map(c => ({value: c.id, label: c.nom}))} value={formData.categorieId} onChange={e => setFormData({...formData, categorieId: e.target.value})} />
          </div>
          <Input label="Libellé" required value={formData.libelle} onChange={e => setFormData({...formData, libelle: e.target.value})} />
          <div className="form-row">
            <Input type="number" step="0.01" label="Prix Unitaire (FCFA)" required value={formData.prixUnitaire} onChange={e => setFormData({...formData, prixUnitaire: e.target.value})} />
            <Input type="number" label="Quantité Initiale en Stock" required value={formData.quantiteStock} onChange={e => setFormData({...formData, quantiteStock: e.target.value})} />
          </div>
          <Input type="number" label="Seuil d'alerte (Stock critique)" required value={formData.seuilAlerte} onChange={e => setFormData({...formData, seuilAlerte: e.target.value})} />
        </form>
      </Modal>
    </>
  );
}
