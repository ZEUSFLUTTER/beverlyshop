import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get('statut') || 'EN_COURS';

    // Get attributions based on status to calculate reconciliation
    const attributions = await prisma.attribution.findMany({
      where: { statut: statut as any },
      orderBy: { dateAttribution: 'desc' },
      include: {
        commercant: { select: { id: true, nom: true, prenom: true } },
        articles: {
          include: {
            article: { select: { code: true, libelle: true } }
          }
        },
        ventes: true
      }
    });

    const results = attributions.map(attr => {
      let montantAttendu = 0;
      let montantDeclare = attr.ventes.reduce((sum, v) => sum + Number(v.montantTotal), 0);
      let articlesReconciliation = [];

      for (const item of attr.articles) {
        const ventesArticle = attr.ventes.filter(v => v.articleId === item.articleId);
        const qteVendue = ventesArticle.reduce((sum, v) => sum + v.quantiteVendue, 0);
        const caAttenduItem = item.quantiteAttribuee * Number(item.prixUnitaireSnapshot);
        const caReelItem = ventesArticle.reduce((sum, v) => sum + Number(v.montantTotal), 0);

        montantAttendu += caAttenduItem;

        articlesReconciliation.push({
          articleId: item.articleId,
          code: item.article.code,
          libelle: item.article.libelle,
          quantiteAttribuee: item.quantiteAttribuee,
          quantiteVendue: qteVendue,
          quantiteRestante: item.quantiteAttribuee - qteVendue,
          caAttendu: caAttenduItem,
          caReel: caReelItem
        });
      }

      return {
        id: attr.id,
        dateAttribution: attr.dateAttribution,
        commercant: attr.commercant,
        statut: attr.statut,
        montantAttendu,
        montantDeclare,
        ecart: montantDeclare - montantAttendu,
        articles: articlesReconciliation
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Erreur GET reconciliation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
