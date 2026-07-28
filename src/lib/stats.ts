import prisma from './prisma';

export interface DailyPoint {
  name: string;
  total: number;
}

export interface AgentSales {
  id: string;
  nom: string;
  prenom: string;
  jour: number;
  semaine: number;
  mois: number;
  total: number;
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** Clé de date locale (YYYY-M-D) pour regrouper par jour sans décalage UTC. */
function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Série des ventes (CA) des `days` derniers jours (aujourd'hui inclus).
 * Filtrable par commerçant.
 */
export async function getDailySales(days = 7, commercantId?: string): Promise<DailyPoint[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const where: any = { dateVente: { gte: start } };
  if (commercantId) where.commercantId = commercantId;

  const ventes = await prisma.vente.findMany({
    where,
    select: { dateVente: true, montantTotal: true },
  });

  // Prépare les buckets ordonnés
  const buckets: { key: string; label: string; total: number }[] = [];
  const index = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = localDateKey(d);
    const label = days <= 7 ? DAY_LABELS[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`;
    index.set(key, buckets.length);
    buckets.push({ key, label, total: 0 });
  }

  ventes.forEach((v) => {
    const key = localDateKey(new Date(v.dateVente));
    const i = index.get(key);
    if (i !== undefined) {
      buckets[i].total += Number(v.montantTotal);
    }
  });

  return buckets.map((b) => ({ name: b.label, total: b.total }));
}

/**
 * Ventes (CA) par commerçant : jour / semaine / mois / total.
 */
export async function getAgentSales(): Promise<AgentSales[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  const day = (today.getDay() + 6) % 7; // lundi = 0
  startOfWeek.setDate(today.getDate() - day);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const commercants = await prisma.user.findMany({
    where: { role: 'COMMERCANT' },
    select: { id: true, nom: true, prenom: true },
  });

  const ventes = await prisma.vente.findMany({
    select: { commercantId: true, montantTotal: true, dateVente: true },
  });

  const result = commercants.map((c) => {
    const cv = ventes.filter((v) => v.commercantId === c.id);
    const sum = (from?: Date) =>
      cv
        .filter((v) => !from || new Date(v.dateVente) >= from)
        .reduce((s, v) => s + Number(v.montantTotal), 0);

    return {
      id: c.id,
      nom: c.nom,
      prenom: c.prenom,
      jour: sum(today),
      semaine: sum(startOfWeek),
      mois: sum(startOfMonth),
      total: sum(),
    };
  });

  return result.sort((a, b) => b.mois - a.mois);
}
