import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'COMMERCANT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body; // Array of { attributionId, articleId, quantiteVendue, prixUnitaireVente }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // Process all sales in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let createdVentes = [];
      
      for (const item of items) {
        // Validate attribution and check if enough remaining quantity
        const attrArticle = await tx.attributionArticle.findUnique({
          where: {
            attributionId_articleId: {
              attributionId: item.attributionId,
              articleId: item.articleId
            }
          }
        });

        if (!attrArticle) {
          throw new Error(`Article non trouvé dans l'attribution`);
        }

        const ventesExistantes = await tx.vente.aggregate({
          where: {
            attributionId: item.attributionId,
            articleId: item.articleId
          },
          _sum: { quantiteVendue: true }
        });

        const qteDejaVendue = ventesExistantes._sum.quantiteVendue || 0;
        const qteRestante = attrArticle.quantiteAttribuee - qteDejaVendue;

        if (item.quantiteVendue > qteRestante) {
          throw new Error(`Quantité demandée (${item.quantiteVendue}) supérieure au stock restant (${qteRestante})`);
        }

        const montantTotal = new Prisma.Decimal(item.prixUnitaireVente).mul(item.quantiteVendue);

        const vente = await tx.vente.create({
          data: {
            attributionId: item.attributionId,
            commercantId: session.id,
            articleId: item.articleId,
            quantiteVendue: item.quantiteVendue,
            prixUnitaireVente: item.prixUnitaireVente,
            montantTotal
          }
        });

        createdVentes.push(vente);
      }

      return createdVentes;
    });

    return NextResponse.json({ success: true, ventes: result }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur POST ventes:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const commercantId = searchParams.get('commercantId');

    const where: any = {};
    
    // Commercant can only see their own sales
    if (session.role === 'COMMERCANT') {
      where.commercantId = session.id;
    } else if (commercantId) {
      where.commercantId = commercantId;
    }

    const ventes = await prisma.vente.findMany({
      where,
      orderBy: { dateVente: 'desc' },
      include: {
        article: { select: { code: true, libelle: true } },
        commercant: { select: { nom: true, prenom: true } }
      }
    });

    return NextResponse.json(ventes);
  } catch (error) {
    console.error('Erreur GET ventes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
