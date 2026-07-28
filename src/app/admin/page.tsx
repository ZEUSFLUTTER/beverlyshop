import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { getDailySales, getAgentSales } from '@/lib/stats';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SalesChart } from '@/components/dashboard/SalesChart';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/');

  // Fetch KPIs
  const totalArticles = await prisma.article.count();
  const totalStock = await prisma.article.aggregate({
    _sum: { quantiteStock: true }
  });
  
  const activeCommercants = await prisma.user.count({
    where: { role: 'COMMERCANT', statut: 'ACTIF' }
  });

  const articles = await prisma.article.findMany({ 
    include: { categorie: true }
  });
  const stockValue = articles.reduce((sum, a) => sum + (a.quantiteStock * Number(a.prixUnitaire)), 0);

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Début de la semaine (lundi)
  const startOfWeek = new Date(today);
  const day = (today.getDay() + 6) % 7; // 0 = lundi
  startOfWeek.setDate(today.getDate() - day);

  // Début du mois
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [salesToday, salesWeek, salesMonth, salesTotal] = await Promise.all([
    prisma.vente.aggregate({
      where: { dateVente: { gte: today } },
      _sum: { montantTotal: true, quantiteVendue: true },
      _count: true,
    }),
    prisma.vente.aggregate({
      where: { dateVente: { gte: startOfWeek } },
      _sum: { montantTotal: true, quantiteVendue: true },
      _count: true,
    }),
    prisma.vente.aggregate({
      where: { dateVente: { gte: startOfMonth } },
      _sum: { montantTotal: true, quantiteVendue: true },
      _count: true,
    }),
    prisma.vente.aggregate({
      _sum: { montantTotal: true, quantiteVendue: true },
      _count: true,
    }),
  ]);

  const lowStockArticles = articles.filter(a => a.quantiteStock <= a.seuilAlerte);

  // Données graphiques & performance par agent
  const dailySales = await getDailySales(7);
  const agentSales = await getAgentSales();

  // Pour le graphique "Team executive" (on va utiliser la répartition du stock par catégorie)
  const stockByCategory = new Map();
  articles.forEach(a => {
    const catName = a.categorie.nom;
    stockByCategory.set(catName, (stockByCategory.get(catName) || 0) + a.quantiteStock);
  });
  
  const pieChartData = Array.from(stockByCategory.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="dashboard-layout">
      {/* Contenu Principal (Gauche) */}
      <div className="flex-1 space-y-8" style={{ overflow: 'auto' }}>
        
        {/* Bannière de bienvenue style Gold */}
        <div style={{ background: 'var(--gradient-primary)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', position: 'relative', overflow: 'hidden', color: 'white' }}>
          <h2 className="text-3xl font-bold mb-3 truncate">Bienvenue, {session.prenom} !</h2>
          <p className="text-white/80 mb-8 text-base max-w-lg">
            Votre tableau de bord est prêt. Gardez un œil sur votre stock, gérez vos commerçants et analysez vos ventes quotidiennes.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/stock">
              <Button variant="primary" size="lg" className="!bg-white !text-[var(--accent-primary)] !shadow-none hover:!bg-gray-50 !rounded-full !px-7 !py-3.5">
                Gérer le Stock
              </Button>
            </Link>
            <Link href="/admin/attributions">
              <Button variant="primary" size="lg" className="!bg-white/20 !text-white !shadow-none hover:!bg-white/30 !rounded-full !px-7 !py-3.5 !border-0">
                Nouvelle Attribution
              </Button>
            </Link>
          </div>
          
          {/* Faux Avatar décoratif à droite (comme sur l'image) */}
          <div className="absolute top-1/2 right-10 transform -translate-y-1/2 hidden md:block">
            <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: '5px solid rgba(255,255,255,0.25)', padding: '6px' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {session.prenom.charAt(0)}{session.nom.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        {/* 4 KPIs Cards (Style minimaliste blanc) */}
        <div className="kpi-grid">
          <Card className="p-6 flex items-center gap-4" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
              <Package size={24} />
            </div>
            <div>
              <p className="font-bold text-2xl leading-tight">{totalStock._sum.quantiteStock || 0}</p>
              <p className="text-sm text-muted font-medium">Articles</p>
            </div>
          </Card>
          
          <Card className="p-6 flex items-center gap-4" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(176,141,87,0.1)', color: 'var(--accent-primary)' }}>
              <Users size={24} />
            </div>
            <div>
              <p className="font-bold text-2xl leading-tight">{activeCommercants}</p>
              <p className="text-sm text-muted font-medium">Commerçants</p>
            </div>
          </Card>
          
          <Card className="p-6 flex items-center gap-4" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(32,201,151,0.1)', color: '#20c997' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="font-bold text-2xl leading-tight">{salesToday._sum.quantiteVendue || 0}</p>
              <p className="text-sm text-muted font-medium">Ventes (J)</p>
            </div>
          </Card>
          
          <Card className="p-6 flex items-center gap-4" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(250,82,82,0.1)', color: '#fa5252' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="font-bold text-2xl leading-tight">{lowStockArticles.length}</p>
              <p className="text-sm text-muted font-medium">Alertes</p>
            </div>
          </Card>
        </div>

        {/* Section Chiffre d'affaires */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-2xl">Chiffre d'affaires</h3>
            <span className="text-sm text-muted">Argent gagné sur les ventes</span>
          </div>
          <div className="revenue-grid">
            <Card className="revenue-card" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className="revenue-card-header">
                <span className="revenue-card-label">Aujourd'hui</span>
                <span className="revenue-badge" style={{ background: 'rgba(32,201,151,0.12)', color: '#12b886' }}>
                  {salesToday._count} vente{salesToday._count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="revenue-card-value">{formatCurrency(salesToday._sum.montantTotal || 0)}</div>
              <div className="revenue-card-sub">{salesToday._sum.quantiteVendue || 0} article(s) vendu(s)</div>
            </Card>

            <Card className="revenue-card" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className="revenue-card-header">
                <span className="revenue-card-label">Cette semaine</span>
                <span className="revenue-badge" style={{ background: 'rgba(34,139,230,0.12)', color: '#228be6' }}>
                  {salesWeek._count} vente{salesWeek._count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="revenue-card-value">{formatCurrency(salesWeek._sum.montantTotal || 0)}</div>
              <div className="revenue-card-sub">{salesWeek._sum.quantiteVendue || 0} article(s) vendu(s)</div>
            </Card>

            <Card className="revenue-card" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className="revenue-card-header">
                <span className="revenue-card-label">Ce mois-ci</span>
                <span className="revenue-badge" style={{ background: 'rgba(250,176,5,0.12)', color: '#d98c02' }}>
                  {salesMonth._count} vente{salesMonth._count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="revenue-card-value">{formatCurrency(salesMonth._sum.montantTotal || 0)}</div>
              <div className="revenue-card-sub">{salesMonth._sum.quantiteVendue || 0} article(s) vendu(s)</div>
            </Card>

            <Card className="revenue-card revenue-card-total" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className="revenue-card-header">
                <span className="revenue-card-label" style={{ color: 'rgba(255,255,255,0.85)' }}>Total</span>
                <span className="revenue-badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  {salesTotal._count} vente{salesTotal._count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="revenue-card-value" style={{ color: 'white' }}>{formatCurrency(salesTotal._sum.montantTotal || 0)}</div>
              <div className="revenue-card-sub" style={{ color: 'rgba(255,255,255,0.75)' }}>{salesTotal._sum.quantiteVendue || 0} article(s) au total</div>
            </Card>
          </div>
        </div>

        {/* Graphique des ventes journalières (7 derniers jours) */}
        <Card className="p-6 md:p-8" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl md:text-2xl">Ventes des 7 derniers jours</h3>
            <span className="text-sm text-muted hidden sm:block">Chiffre d'affaires par jour</span>
          </div>
          <SalesChart data={dailySales} type="bar" />
        </Card>

        {/* Performance par commerçant */}
        <Card style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div className="table-header">
            <h3 className="table-title">Ventes par commerçant</h3>
            <span className="text-sm text-muted">Jour · Semaine · Mois</span>
          </div>
          <div className="table-wrapper">
            {agentSales.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Users size={32} /></div>
                <h3>Aucun commerçant</h3>
                <p>Ajoutez des commerçants pour suivre leurs performances.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Commerçant</th>
                    <th className="text-right">Aujourd'hui</th>
                    <th className="text-right">Cette semaine</th>
                    <th className="text-right">Ce mois</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {agentSales.map((a) => (
                    <tr key={a.id}>
                      <td className="font-bold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                            {a.prenom.charAt(0)}{a.nom.charAt(0)}
                          </div>
                          <span>{a.prenom} {a.nom}</span>
                        </div>
                      </td>
                      <td className="text-right">{formatCurrency(a.jour)}</td>
                      <td className="text-right">{formatCurrency(a.semaine)}</td>
                      <td className="text-right">{formatCurrency(a.mois)}</td>
                      <td className="text-right font-bold text-accent">{formatCurrency(a.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Section Graphique "Team executive" style */}
        <Card className="p-8" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-2xl">Répartition du Stock</h3>
            <span className="font-bold text-lg" style={{ color: 'var(--text-secondary)' }}>{totalStock._sum.quantiteStock || 0} Unités</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-full md:w-1/2">
              <SalesChart data={pieChartData} type="pie" />
            </div>
            <div className="w-full md:w-1/2 space-y-5">
              {pieChartData.map((d: any, i) => {
                const colors = ['#b08d57', '#EA4335', '#FBBC05', '#34A853', '#C8A165'];
                const color = colors[i % colors.length];
                return (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div style={{ color: color }}><Package size={20} /></div>
                      <span className="text-base font-semibold">{d.name}</span>
                    </div>
                    <span className="font-bold text-xl">{d.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Colonne de droite (Beige - My activity) */}
      <div className="right-sidebar">
        <h3 className="right-sidebar-title">Activités & Alertes</h3>
        
        {/* Ventes du Jour */}
        <div className="sidebar-section">
          <h4 className="sidebar-section-title">Performances du jour</h4>
          <div className="sidebar-card">
            <div className="sidebar-icon-container" style={{ background: 'rgba(32,201,151,0.1)', color: '#20c997' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="sidebar-text-value">{formatCurrency(salesToday._sum.montantTotal || 0)}</p>
              <p className="sidebar-text-label">Chiffre d'affaires</p>
            </div>
          </div>
        </div>

        {/* Alertes de stock */}
        <div className="sidebar-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="sidebar-section-title">Alertes Stock</h4>
            <Link href="/admin/stock" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textDecoration: 'none' }}>Voir tout</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {lowStockArticles.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Aucune alerte.</p>
            ) : (
              lowStockArticles.slice(0, 3).map(article => (
                <div key={article.id} className="sidebar-card">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{article.libelle}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--accent-danger)', margin: '0.25rem 0 0 0' }}>Stock: {article.quantiteStock}</p>
                  </div>
                  <AlertTriangle size={20} style={{ color: 'var(--accent-danger)' }} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="sidebar-section" style={{ marginTop: 'auto' }}>
          <h4 className="sidebar-section-title">Actions rapides</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link href="/admin/commercants" className="sidebar-quick-action">
              <div className="sidebar-quick-action-icon" style={{ background: 'rgba(176,141,87,0.1)', color: 'var(--accent-primary)' }}>
                <Users size={20} />
              </div>
              <span className="sidebar-quick-action-text">Gérer Commerçants</span>
              <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </Link>
            <Link href="/admin/reconciliation" className="sidebar-quick-action">
              <div className="sidebar-quick-action-icon" style={{ background: 'rgba(147,51,234,0.1)', color: '#9333ea' }}>
                <ShoppingCart size={20} />
              </div>
              <span className="sidebar-quick-action-text">Réconciliation</span>
              <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
