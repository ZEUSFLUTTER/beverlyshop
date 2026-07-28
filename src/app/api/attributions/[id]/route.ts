import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const id = (await params).id;

    const attribution = await prisma.attribution.findUnique({
      where: { id },
      include: {
        commercant: { select: { id: true, nom: true, prenom: true } },
        admin: { select: { id: true, nom: true, prenom: true } },
        articles: {
          include: {
            article: { select: { id: true, code: true, libelle: true } }
          }
        }
      }
    });

    if (!attribution) return NextResponse.json({ error: 'Attribution introuvable' }, { status: 404 });

    // Allow commercant to view only their own attributions
    if (session.role === 'COMMERCANT' && attribution.commercantId !== session.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    return NextResponse.json(attribution);
  } catch (error) {
    console.error('Erreur GET attribution:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: 'Impossible de supprimer une attribution clôturée' }, { status: 400 });
    }

    // Check if any sales were made on this attribution
    const salesCount = await prisma.vente.count({ where: { attributionId: id } });
    if (salesCount > 0) {
      return NextResponse.json({ error: 'Impossible de supprimer car des ventes ont déjà été enregistrées' }, { status: 400 });
    }

    // Restore stock and delete in transaction
    await prisma.$transaction(async (tx) => {
      for (const item of attribution.articles) {
        await tx.article.update({
          where: { id: item.articleId },
          data: { quantiteStock: { increment: item.quantiteAttribuee } }
        });
      }
      
      await tx.attributionArticle.deleteMany({ where: { attributionId: id } });
      await tx.attribution.delete({ where: { id } });
    });

    await logAudit(session.id, 'ANNULATION_ATTRIBUTION', 'Attribution', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE attribution:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
