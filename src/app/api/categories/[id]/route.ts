import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const id = (await params).id;
    const { nom, description } = await request.json();

    if (!nom) {
      return NextResponse.json({ error: 'Le nom de la catégorie est requis' }, { status: 400 });
    }

    const exist = await prisma.categorie.findFirst({ where: { nom, id: { not: id } } });
    if (exist) {
      return NextResponse.json({ error: 'Une catégorie avec ce nom existe déjà' }, { status: 400 });
    }

    const categorie = await prisma.categorie.update({
      where: { id },
      data: { nom, description },
    });

    await logAudit(session.id, 'MODIFICATION_CATEGORIE', 'Categorie', id, { nom });

    return NextResponse.json(categorie);
  } catch (error) {
    console.error('Erreur PUT categorie:', error);
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

    const count = await prisma.article.count({ where: { categorieId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer cette catégorie car elle contient des articles.' },
        { status: 400 }
      );
    }

    await prisma.categorie.delete({ where: { id } });

    await logAudit(session.id, 'SUPPRESSION_CATEGORIE', 'Categorie', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE categorie:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
