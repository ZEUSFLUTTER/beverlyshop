import { Decimal } from '@prisma/client/runtime/library';

// ============== Format Helpers ==============

export function formatCurrency(amount: number | Decimal | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : typeof amount === 'number' ? amount : amount.toNumber();
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num) + ' FCFA';
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

// ============== Calculation Helpers ==============

export function calculateEcart(montantDeclare: number, montantAttendu: number): number {
  return montantDeclare - montantAttendu;
}

export function calculateEcartPourcent(montantDeclare: number, montantAttendu: number): number {
  if (montantAttendu === 0) return 0;
  return ((montantDeclare - montantAttendu) / montantAttendu) * 100;
}

export function calculateMontantAttendu(prixUnitaire: number, quantiteVendue: number): number {
  return prixUnitaire * quantiteVendue;
}

// ============== Validation Helpers ==============

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Au moins 8 caractères');
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule');
  if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule');
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre');
  return { valid: errors.length === 0, errors };
}

export function validateCode(code: string): boolean {
  return /^[A-Za-z0-9]{1,10}$/.test(code);
}

// ============== Stock Level ==============

export function getStockLevel(quantite: number, seuil: number): 'high' | 'medium' | 'low' {
  if (quantite <= 0) return 'low';
  if (quantite <= seuil) return 'low';
  if (quantite <= seuil * 2) return 'medium';
  return 'high';
}

export function getStockLevelLabel(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high': return 'En stock';
    case 'medium': return 'Stock faible';
    case 'low': return 'Stock critique';
  }
}

// ============== Statut Labels ==============

export function getStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    ACTIF: 'Actif',
    SUSPENDU: 'Suspendu',
    REVOQUE: 'Révoqué',
    EN_COURS: 'En cours',
    CLOTURE: 'Clôturé',
    BROUILLON: 'Brouillon',
    SOUMIS: 'Soumis',
    VALIDE: 'Validé',
  };
  return labels[statut] || statut;
}

export function getStatutBadgeClass(statut: string): string {
  const classes: Record<string, string> = {
    ACTIF: 'badge-success',
    SUSPENDU: 'badge-warning',
    REVOQUE: 'badge-danger',
    EN_COURS: 'badge-info',
    CLOTURE: 'badge-neutral',
    BROUILLON: 'badge-warning',
    SOUMIS: 'badge-info',
    VALIDE: 'badge-success',
  };
  return classes[statut] || 'badge-neutral';
}

// ============== Misc ==============

export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
