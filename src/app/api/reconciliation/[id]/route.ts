import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const id = (await params).id;

    const attribution = await prisma.attribution.findUnique({
      where: { id },
      include: { articles: true }
    });

    if (!attribution) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    if (attribution.statut !== 'EN_COURS') {
      return NextResponse.json({ error: 'Attribution déjà clôturée' }, { status: 400 });
    }

    // Clôture: Update status. The remaining stock is physically with the commerçant, but logically we need to 
    // handle it. Typically, unsold goods are returned to the main stock.
    // We calculate how many items were not sold and return them to stock.
    
    await prisma.$transaction(async (tx) => {
      // 1. Get all sales for this attribution
      const ventes = await tx.vente.findMany({ where: { attributionId: id } });

      for (const item of attribution.articles) {
        // Calculate what was sold
        const ventesArticle = ventes.filter(v => v.articleId === item.articleId);
        const qteVendue = ventesArticle.reduce((sum, v) => sum + v.quantiteVendue, 0);
        const qteInvendue = item.quantiteAttribuee - qteVendue;

        // If there are unsold items, return them to main stock
        if (qteInvendue > 0) {
          await tx.article.update({
            where: { id: item.articleId },
            data: { quantiteStock: { increment: qteInvendue } }
          });
        }
      }

      // 2. Mark as CLOTURE
      await tx.attribution.update({
        where: { id },
        data: { statut: 'CLOTURE' }
      });
    });

    await logAudit(session.id, 'CLOTURE_ATTRIBUTION', 'Attribution', id);

    return NextResponse.json({ success: true, message: 'Attribution clôturée et stock invendu restauré' });
  } catch (error) {
    console.error('Erreur POST cloture:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
