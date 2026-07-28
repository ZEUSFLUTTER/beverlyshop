import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const categorieId = searchParams.get('categorieId') || '';

    const where: Prisma.ArticleWhereInput = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { libelle: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (categorieId) {
      where.categorieId = categorieId;
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        categorie: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Erreur GET articles:', error);
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
    const { code, libelle, categorieId, prixUnitaire, quantiteStock, seuilAlerte } = body;

    if (!code || !libelle || !categorieId || prixUnitaire === undefined || quantiteStock === undefined) {
      return NextResponse.json({ error: 'Veuillez remplir tous les champs obligatoires' }, { status: 400 });
    }

    const exist = await prisma.article.findUnique({ where: { code } });
    if (exist) {
      return NextResponse.json({ error: 'Un article avec ce code existe déjà' }, { status: 400 });
    }

    const article = await prisma.article.create({
      data: {
        code,
        libelle,
        categorieId,
        prixUnitaire: new Prisma.Decimal(prixUnitaire),
        quantiteStock: parseInt(quantiteStock, 10),
        seuilAlerte: seuilAlerte ? parseInt(seuilAlerte, 10) : 5,
      },
      include: {
        categorie: true,
      }
    });

    await logAudit(session.id, 'CREATION_ARTICLE', 'Article', article.id, { code, quantiteStock });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Erreur POST article:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
