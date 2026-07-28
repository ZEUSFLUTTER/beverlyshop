import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Package, TrendingUp, DollarSign, ShoppingCart, ChevronRight, BarChart3 } from 'lucide-react';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { getDailySales } from '@/lib/stats';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SalesChart } from '@/components/dashboard/SalesChart';
import Link from 'next/link';

export default async function CommercantDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'COMMERCANT') redirect('/');

  // Fetch active attributions for this commerçant
  const attributions = await prisma.attribution.findMany({
    where: { commercantId: session.id, statut: 'EN_COURS' },
    include: { articles: true }
  });

  let totalArticlesAttribues = 0;
  attributions.forEach(a => {
    totalArticlesAttribues += a.articles.reduce((sum, item) => sum + item.quantiteAttribuee, 0);
  });

  // Sales
  const ventes = await prisma.vente.findMany({
    where: { commercantId: session.id },
    include: { article: true },
    orderBy: { dateVente: 'desc' },
    take: 5
  });

  const allVentes = await prisma.vente.findMany({
    where: { commercantId: session.id }
  });

  const totalVendu = allVentes.reduce((sum, v) => sum + v.quantiteVendue, 0);
  const caRealise = allVentes.reduce((sum, v) => sum + Number(v.montantTotal), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ventesAujourdhui = allVentes.filter(v => new Date(v.dateVente) >= today);
  const caAujourdhui = ventesAujourdhui.reduce((sum, v) => sum + Number(v.montantTotal), 0);

  // CA semaine (depuis lundi) et mois (depuis le 1er)
  const startOfWeek = new Date(today);
  const dow = (today.getDay() + 6) % 7;
  startOfWeek.setDate(today.getDate() - dow);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const caSemaine = allVentes
    .filter(v => new Date(v.dateVente) >= startOfWeek)
    .reduce((sum, v) => sum + Number(v.montantTotal), 0);
  const caMois = allVentes
    .filter(v => new Date(v.dateVente) >= startOfMonth)
    .reduce((sum, v) => sum + Number(v.montantTotal), 0);

  const dailySales = await getDailySales(7, session.id);

  const articlesEnPossession = totalArticlesAttribues - totalVendu;

  return (
    <div className="dashboard-layout">
      {/* Main Content (Left) */}
      <div className="flex-1 space-y-8" style={{ overflow: 'auto' }}>
        
        {/* Welcome Banner */}
        <div style={{ background: 'var(--gradient-primary)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', position: 'relative', overflow: 'hidden', color: 'white' }}>
          <h2 className="text-3xl font-bold mb-3 truncate">Bienvenue, {session.prenom} !</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1rem', maxWidth: '32rem' }}>
            Consultez vos articles, enregistrez vos ventes et suivez vos performances en temps réel.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/commercant/ventes">
              <Button variant="primary" size="lg" style={{ background: 'white', color: 'var(--accent-primary)', boxShadow: 'none', borderRadius: '99px', padding: '0.875rem 1.75rem' }}>
                Enregistrer Ventes
              </Button>
            </Link>
            <Link href="/commercant/articles">
              <Button variant="primary" size="lg" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', boxShadow: 'none', borderRadius: '99px', padding: '0.875rem 1.75rem', border: 'none' }}>
                Voir mes Articles
              </Button>
            </Link>
          </div>

          {/* Decorative avatar */}
          <div style={{ position: 'absolute', top: '50%', right: '2.5rem', transform: 'translateY(-50%)' }} className="hidden md:block">
            <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: '5px solid rgba(255,255,255,0.25)', padding: '6px' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {session.prenom.charAt(0)}{session.nom.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <Card className="p-6 flex items-center gap-4" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(176,141,87,0.1)', color: 'var(--accent-primary)' }}>
              <Package size={24} />
            </div>
            <div>
              <p className="font-bold text-2xl leading-tight">{articlesEnPossession}</p>
              <p className="text-sm text-muted font-medium">Articles en stock</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(32,201,151,0.1)', color: '#20c997' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="font-bold text-2xl leading-tight">{ventesAujourdhui.length}</p>
              <p className="text-sm text-muted font-medium">Ventes (J)</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="font-bold text-2xl leading-tight">{totalVendu}</p>
              <p className="text-sm text-muted font-medium">Total Vendus</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <p className="font-bold text-2xl leading-tight">{formatCurrency(caRealise)}</p>
              <p className="text-sm text-muted font-medium">CA Total</p>
            </div>
          </Card>
        </div>

        {/* Chiffre d'affaires par période */}
        <div className="revenue-grid revenue-grid-3">
          <Card className="revenue-card" style={{ borderRadius: 'var(--radius-lg)' }}>
            <span className="revenue-card-label">Aujourd'hui</span>
            <div className="revenue-card-value">{formatCurrency(caAujourdhui)}</div>
            <div className="revenue-card-sub">{ventesAujourdhui.length} opération(s)</div>
          </Card>
          <Card className="revenue-card" style={{ borderRadius: 'var(--radius-lg)' }}>
            <span className="revenue-card-label">Cette semaine</span>
            <div className="revenue-card-value">{formatCurrency(caSemaine)}</div>
            <div className="revenue-card-sub">depuis lundi</div>
          </Card>
          <Card className="revenue-card" style={{ borderRadius: 'var(--radius-lg)' }}>
            <span className="revenue-card-label">Ce mois-ci</span>
            <div className="revenue-card-value">{formatCurrency(caMois)}</div>
            <div className="revenue-card-sub">mois en cours</div>
          </Card>
        </div>

        {/* Graphique des ventes journalières */}
        <Card className="p-6 md:p-8" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl md:text-2xl">Mes ventes (7 derniers jours)</h3>
          </div>
          <SalesChart data={dailySales} type="bar" />
        </Card>

        {/* Recent Sales */}
        <Card style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div className="table-header">
            <h3 className="table-title">Dernières Ventes</h3>
            <Link href="/commercant/historique" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textDecoration: 'none' }}>Voir tout</Link>
          </div>
          <div className="table-wrapper">
            {ventes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><ShoppingCart size={32} /></div>
                <h3>Aucune vente récente</h3>
                <p>Enregistrez vos premières ventes.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Article</th>
                    <th className="text-right">Qté</th>
                    <th className="text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {ventes.map(v => (
                    <tr key={v.id}>
                      <td>{formatDateShort(v.dateVente)}</td>
                      <td className="font-bold">{v.article.libelle}</td>
                      <td className="text-right">{v.quantiteVendue}</td>
                      <td className="text-right font-bold text-accent">{formatCurrency(v.montantTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        <h3 className="right-sidebar-title">Mon Activité</h3>
        
        {/* CA du Jour */}
        <div className="sidebar-section">
          <h4 className="sidebar-section-title">Chiffre d'affaires du jour</h4>
          <div className="sidebar-card">
            <div className="sidebar-icon-container" style={{ background: 'rgba(32,201,151,0.1)', color: '#20c997' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="sidebar-text-value">{formatCurrency(caAujourdhui)}</p>
              <p className="sidebar-text-label">{ventesAujourdhui.length} opération(s)</p>
            </div>
          </div>
        </div>

        {/* Attributions actives */}
        <div className="sidebar-section">
          <h4 className="sidebar-section-title">Attributions actives</h4>
          <div className="sidebar-card">
            <div className="sidebar-icon-container" style={{ background: 'rgba(176,141,87,0.1)', color: 'var(--accent-primary)' }}>
              <Package size={24} />
            </div>
            <div>
              <p className="sidebar-text-value">{attributions.length}</p>
              <p className="sidebar-text-label">attribution(s) en cours</p>
            </div>
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="sidebar-section" style={{ marginTop: 'auto' }}>
          <h4 className="sidebar-section-title">Actions rapides</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link href="/commercant/ventes" className="sidebar-quick-action">
              <div className="sidebar-quick-action-icon" style={{ background: 'rgba(32,201,151,0.1)', color: '#20c997' }}>
                <ShoppingCart size={20} />
              </div>
              <span className="sidebar-quick-action-text">Enregistrer Ventes</span>
              <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </Link>
            <Link href="/commercant/historique" className="sidebar-quick-action">
              <div className="sidebar-quick-action-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                <BarChart3 size={20} />
              </div>
              <span className="sidebar-quick-action-text">Historique</span>
              <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
