'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  History,
  User as UserIcon,
  Tag
} from 'lucide-react';
import { SessionUser } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';

interface SidebarProps {
  user: SessionUser;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ user, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      showToast('info', 'Déconnexion réussie');
    } catch {
      showToast('error', 'Erreur lors de la déconnexion');
    }
  };

  const adminLinks = [
    { href: '/admin', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
    { href: '/admin/stock', icon: <Package size={20} />, label: 'Stock d\'articles' },
    { href: '/admin/categories', icon: <Tag size={20} />, label: 'Catégories' },
    { href: '/admin/commercants', icon: <Users size={20} />, label: 'Commerçants' },
    { href: '/admin/attributions', icon: <ShoppingCart size={20} />, label: 'Attributions' },
    { href: '/admin/reconciliation', icon: <FileText size={20} />, label: 'Réconciliation' },
    { href: '/admin/parametres', icon: <Settings size={20} />, label: 'Paramètres' },
  ];

  const commercantLinks = [
    { href: '/commercant', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
    { href: '/commercant/articles', icon: <Package size={20} />, label: 'Mes articles' },
    { href: '/commercant/ventes', icon: <ShoppingCart size={20} />, label: 'Enregistrer Ventes' },
    { href: '/commercant/historique', icon: <History size={20} />, label: 'Historique' },
    { href: '/commercant/profil', icon: <UserIcon size={20} />, label: 'Mon compte' },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : commercantLinks;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">BS</div>
            <div className="sidebar-brand-text">
              <h2>Beverly Shop</h2>
              <p>Gestion de Stock</p>
            </div>
            <button className="mobile-menu-btn" onClick={() => setIsOpen(false)} style={{ marginLeft: 'auto' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => {
            const isActive = link.href === '/admin' || link.href === '/commercant'
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <div className="sidebar-link-icon">{link.icon}</div>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Faux Toggle Light/Dark pour correspondre à la maquette */}
          <div style={{ display: 'flex', background: '#2A2A2A', borderRadius: '99px', padding: '4px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--accent-primary)', color: 'white', borderRadius: '99px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', background: 'white', borderRadius: '50%' }}></span> Light
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#888', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', border: '2px solid #888', borderRadius: '50%' }}></span> Dark
            </div>
          </div>

          <Link href={user.role === 'ADMIN' ? '/admin/parametres' : '/commercant/profil'} style={{ textDecoration: 'none' }}>
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.prenom.charAt(0)}{user.nom.charAt(0)}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.prenom} {user.nom}</div>
                <div style={{ fontSize: '0.7rem', color: '#67A559', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#67A559', borderRadius: '50%' }}></span>
                  Active
                </div>
              </div>
            </div>
          </Link>
          <button 
            onClick={handleLogout}
            className="sidebar-link" 
            style={{ width: '100%', color: 'var(--accent-danger)' }}
          >
            <div className="sidebar-link-icon"><LogOut size={20} /></div>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
