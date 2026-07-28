'use client';

import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionUser } from '@/lib/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      });
  }, []);

  if (!user) return null;

  return (
    <div className="app-layout">
      <Sidebar user={user} isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <main className="main-content">
        <header className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button className="mobile-menu-btn" onClick={() => setIsOpen(true)}>
            <Menu size={20} />
          </button>
        </header>
        
        <div className="page-body">
          {children}
        </div>
      </main>
    </div>
  );
}
