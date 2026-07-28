import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'COMMERCANT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get active attributions for the commercant
    const attributions = await prisma.attribution.findMany({
      where: { 
        commercantId: session.id,
        statut: 'EN_COURS'
      },
      include: {
        articles: {
          include: {
            article: true
          }
        }
      }
    });

    // We need to calculate how many items are left for each article.
    // They received a certain amount, and they sold some. We need to subtract the sold ones.
    // Actually, we can get the total sold for this attribution.
    
    let articlesDisponibles: any[] = [];

    for (const attr of attributions) {
      // Find all sales for this attribution
      const ventes = await prisma.vente.findMany({
        where: { attributionId: attr.id }
      });
      
      for (const attrArticle of attr.articles) {
        // Find sales for this specific article in this attribution
        const quantiteVendue = ventes
          .filter(v => v.articleId === attrArticle.articleId)
          .reduce((sum, v) => sum + v.quantiteVendue, 0);

        const quantiteRestante = attrArticle.quantiteAttribuee - quantiteVendue;

        if (quantiteRestante > 0) {
          articlesDisponibles.push({
            attributionId: attr.id,
            articleId: attrArticle.articleId,
            code: attrArticle.article.code,
            libelle: attrArticle.article.libelle,
            prixUnitaire: attrArticle.prixUnitaireSnapshot, // Use the price at the time of attribution
            quantiteInitiale: attrArticle.quantiteAttribuee,
            quantiteVendue,
            quantiteRestante
          });
        }
      }
    }

    return NextResponse.json(articlesDisponibles);
  } catch (error) {
    console.error('Erreur GET commercant articles:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
