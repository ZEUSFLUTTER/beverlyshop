import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { Prisma } from '@prisma/client';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const id = (await params).id;
    const body = await request.json();
    const { code, libelle, categorieId, prixUnitaire, quantiteStock, seuilAlerte } = body;

    if (!code || !libelle || !categorieId || prixUnitaire === undefined || quantiteStock === undefined) {
      return NextResponse.json({ error: 'Veuillez remplir tous les champs obligatoires' }, { status: 400 });
    }

    const exist = await prisma.article.findFirst({ where: { code, id: { not: id } } });
    if (exist) {
      return NextResponse.json({ error: 'Un article avec ce code existe déjà' }, { status: 400 });
    }

    const oldArticle = await prisma.article.findUnique({ where: { id } });

    const article = await prisma.article.update({
      where: { id },
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

    // Check if stock changed to log specifically
    if (oldArticle && oldArticle.quantiteStock !== article.quantiteStock) {
      await logAudit(session.id, 'MODIFICATION_STOCK', 'Article', id, { 
        code, 
        oldStock: oldArticle.quantiteStock, 
        newStock: article.quantiteStock 
      });
    } else {
      await logAudit(session.id, 'MODIFICATION_ARTICLE', 'Article', id, { code });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Erreur PUT article:', error);
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

    // Delete all related records first
    await prisma.vente.deleteMany({ where: { articleId: id } });
    await prisma.attributionArticle.deleteMany({ where: { articleId: id } });
    
    // Delete article
    await prisma.article.delete({ where: { id } });

    await logAudit(session.id, 'SUPPRESSION_ARTICLE', 'Article', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE article:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
