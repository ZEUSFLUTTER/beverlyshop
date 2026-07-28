import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const attributions = await prisma.attribution.findMany({
      orderBy: { dateAttribution: 'desc' },
      include: {
        commercant: {
          select: { id: true, nom: true, prenom: true }
        },
        admin: {
          select: { id: true, nom: true, prenom: true }
        },
        articles: {
          include: {
            article: {
              select: { id: true, code: true, libelle: true }
            }
          }
        }
      }
    });

    return NextResponse.json(attributions);
  } catch (error) {
    console.error('Erreur GET attributions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { commercantId, notes, items } = body;

    if (!commercantId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Commerçant et articles requis' }, { status: 400 });
    }

    // Verify stock availability
    for (const item of items) {
      const article = await prisma.article.findUnique({ where: { id: item.articleId } });
      if (!article) {
        return NextResponse.json({ error: `Article introuvable: ${item.articleId}` }, { status: 404 });
      }
      if (article.quantiteStock < item.quantite) {
        return NextResponse.json({ error: `Stock insuffisant pour l'article ${article.libelle}` }, { status: 400 });
      }
    }

    // Create attribution and update stock in a transaction
    const attribution = await prisma.$transaction(async (tx) => {
      // 1. Create attribution
      const attr = await tx.attribution.create({
        data: {
          commercantId,
          adminId: session.id,
          notes,
          statut: 'EN_COURS',
        }
      });

      // 2. Add articles and decrement stock
      for (const item of items) {
        const article = await tx.article.findUnique({ where: { id: item.articleId } });
        
        await tx.attributionArticle.create({
          data: {
            attributionId: attr.id,
            articleId: item.articleId,
            quantiteAttribuee: item.quantite,
            prixUnitaireSnapshot: article!.prixUnitaire,
          }
        });

        await tx.article.update({
          where: { id: item.articleId },
          data: { quantiteStock: { decrement: item.quantite } }
        });
      }

      return attr;
    });

    await logAudit(session.id, 'CREATION_ATTRIBUTION', 'Attribution', attribution.id, { commercantId, nbArticles: items.length });

    return NextResponse.json(attribution, { status: 201 });
  } catch (error) {
    console.error('Erreur POST attribution:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
