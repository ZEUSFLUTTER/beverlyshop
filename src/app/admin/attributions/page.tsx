'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, ShoppingCart, Info, CheckCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TableContainer, TableHeader } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatDateShort } from '@/lib/utils';

export default function AttributionsPage() {
  const { showToast } = useToast();
  const [attributions, setAttributions] = useState<any[]>([]);
  const [commercants, setCommercants] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Attribution form state
  const [selectedCommercant, setSelectedCommercant] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<{articleId: string, libelle: string, stock: number, quantite: number}[]>([]);
  const [articleSearch, setArticleSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attrRes, commRes, artRes] = await Promise.all([
        fetch('/api/attributions'),
        fetch('/api/commercants'),
        fetch('/api/articles')
      ]);
      
      if (attrRes.ok) setAttributions(await attrRes.json());
      if (commRes.ok) {
        const comms = await commRes.json();
        setCommercants(comms.filter((c: any) => c.statut === 'ACTIF'));
      }
      if (artRes.ok) setArticles(await artRes.json());
    } catch {
      showToast('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setSelectedCommercant('');
    setNotes('');
    setCart([]);
    setArticleSearch('');
    setIsModalOpen(true);
  };

  const handleAddToCart = (article: any) => {
    if (article.quantiteStock <= 0) {
      showToast('error', 'Stock épuisé pour cet article');
      return;
    }
    
    if (cart.find(item => item.articleId === article.id)) {
      showToast('info', 'Cet article est déjà dans la liste');
      return;
    }
    
    setCart([...cart, {
      articleId: article.id,
      libelle: article.libelle,
      stock: article.quantiteStock,
      quantite: 1
    }]);
  };

  const handleUpdateCartQuantity = (id: string, qty: number) => {
    setCart(cart.map(item => {
      if (item.articleId === id) {
        // Enforce boundaries
        const newQty = Math.max(1, Math.min(qty, item.stock));
        return { ...item, quantite: newQty };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(item => item.articleId !== id));
  };

  const handleSubmit = async () => {
    if (!selectedCommercant) {
      showToast('error', 'Veuillez sélectionner un commerçant');
      return;
    }
    if (cart.length === 0) {
      showToast('error', 'Veuillez ajouter au moins un article');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/attributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commercantId: selectedCommercant,
          notes,
          items: cart.map(item => ({
            articleId: item.articleId,
            quantite: item.quantite
          }))
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast('success', 'Attribution enregistrée avec succès');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette attribution ? Les stocks seront restaurés.')) return;
    
    try {
      const res = await fetch(`/api/attributions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      showToast('success', 'Attribution annulée et stocks restaurés');
      fetchData();
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const filteredArticles = articles.filter(a => 
    a.libelle.toLowerCase().includes(articleSearch.toLowerCase()) || 
    a.code.toLowerCase().includes(articleSearch.toLowerCase())
  );

  const totalQuantite = cart.reduce((sum, item) => sum + item.quantite, 0);

  return (
    <>
      <div className="page-toolbar">
        <div className="toolbar-filters">
          <p className="text-muted">Gérez les attributions d'articles aux commerçants pour la vente.</p>
        </div>
      </div>

      <TableContainer>
        <TableHeader 
          title="Historique des Attributions" 
          actions={
            <Button onClick={handleOpenModal} leftIcon={<Plus size={18} />}>
              Nouvelle Attribution
            </Button>
          }
        />
        {loading ? (
          <div className="p-8 text-center"><span className="spinner"></span></div>
        ) : attributions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ShoppingCart size={32} /></div>
            <h3>Aucune attribution</h3>
            <p>Cliquez sur "Nouvelle Attribution" pour commencer.</p>
          </div>
        ) : (
          <thead>
            <tr>
              <th>Date</th>
              <th>Commerçant</th>
              <th>Admin (Auteur)</th>
              <th className="text-center">Nb d'Articles</th>
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
        )}
        <tbody>
          {attributions.map((attr) => (
            <tr key={attr.id}>
              <td>{formatDateShort(attr.dateAttribution)}</td>
              <td className="font-bold">{attr.commercant.prenom} {attr.commercant.nom}</td>
              <td className="text-muted">{attr.admin.prenom} {attr.admin.nom}</td>
              <td className="text-center font-bold">{attr.articles.length} types</td>
              <td>
                <Badge variant={attr.statut === 'EN_COURS' ? 'warning' : 'success'}>
                  {attr.statut === 'EN_COURS' ? 'En cours' : 'Clôturé'}
                </Badge>
              </td>
              <td className="text-right">
                {attr.statut === 'EN_COURS' && (
                  <button onClick={() => handleDelete(attr.id)} className="btn-icon text-muted hover:text-danger transition-colors" title="Annuler">
                    <Trash2 size={18} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </TableContainer>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nouvelle Attribution"
        size="lg"
        footer={
          <>
            <div className="mr-auto text-sm text-muted hidden sm:block">
              {cart.length > 0 && (
                <span><strong className="text-primary">{cart.length}</strong> article(s) · <strong className="text-primary">{totalQuantite}</strong> unité(s)</span>
              )}
            </div>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting} leftIcon={<CheckCircle size={18}/>}>
              Valider l'attribution
            </Button>
          </>
        }
      >
        <div className="attr-modal-grid">
          {/* Colonne gauche : sélection */}
          <div className="flex flex-col gap-5">
            <Select 
              label="Commerçant" 
              required 
              containerClassName="mb-0"
              options={commercants.map(c => ({value: c.id, label: `${c.prenom} ${c.nom}`}))}
              value={selectedCommercant}
              onChange={e => setSelectedCommercant(e.target.value)}
            />

            <div>
              <label className="form-label">Rechercher des articles à attribuer</label>
              <Input 
                placeholder="Rechercher par nom ou code..." 
                value={articleSearch}
                onChange={e => setArticleSearch(e.target.value)}
                leftIcon={<Search size={16} />}
              />
              <div className="attr-article-list">
                {filteredArticles.length === 0 ? (
                  <div className="p-4 text-center text-muted text-sm">Aucun article trouvé</div>
                ) : (
                  <ul>
                    {filteredArticles.map(article => {
                      const inCart = cart.some(c => c.articleId === article.id);
                      const outOfStock = article.quantiteStock <= 0;
                      return (
                        <li key={article.id} className="attr-article-row">
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{article.libelle}</div>
                            <div className="text-xs text-muted mt-0.5">
                              <span className="font-mono">{article.code}</span>
                              <span className="mx-1.5">·</span>
                              <span className={outOfStock ? 'text-danger font-semibold' : ''}>
                                Stock : {article.quantiteStock}
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant={inCart ? 'ghost' : 'secondary'}
                            leftIcon={inCart ? <Check size={14} /> : <Plus size={14} />}
                            onClick={() => handleAddToCart(article)}
                            disabled={outOfStock || inCart}
                          >
                            {inCart ? 'Ajouté' : 'Ajouter'}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="form-group w-full mb-0">
              <label className="form-label">Notes (optionnel)</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Précisions sur cette attribution..."
                rows={2}
              />
            </div>
          </div>

          {/* Colonne droite : panier */}
          <div className="attr-cart">
            <div className="attr-cart-header">
              <span className="flex items-center gap-2 font-bold text-sm">
                <ShoppingCart size={16} /> Articles sélectionnés
              </span>
              <span className="badge badge-neutral">{cart.length}</span>
            </div>

            <div className="attr-cart-body">
              {cart.length === 0 ? (
                <div className="attr-cart-empty">
                  <ShoppingCart size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">Aucun article sélectionné</p>
                  <p className="text-xs mt-1">Ajoutez des articles depuis la liste</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {cart.map(item => (
                    <li key={item.articleId} className="attr-cart-item">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm truncate" title={item.libelle}>{item.libelle}</div>
                        <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
                          <Info size={11}/> Stock disponible : {item.stock}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="qty-input">
                          <button 
                            type="button"
                            className="qty-btn"
                            onClick={() => handleUpdateCartQuantity(item.articleId, item.quantite - 1)}
                          >−</button>
                          <input 
                            type="number" 
                            className="qty-value"
                            value={item.quantite}
                            onChange={(e) => handleUpdateCartQuantity(item.articleId, parseInt(e.target.value) || 1)}
                            min={1}
                            max={item.stock}
                          />
                          <button 
                            type="button"
                            className="qty-btn"
                            onClick={() => handleUpdateCartQuantity(item.articleId, item.quantite + 1)}
                          >+</button>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveFromCart(item.articleId)}
                          className="btn-icon text-muted hover:text-danger transition-colors"
                          title="Retirer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
