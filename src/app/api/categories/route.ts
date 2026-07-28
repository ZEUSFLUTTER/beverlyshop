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

    const categories = await prisma.categorie.findMany({
      orderBy: { nom: 'asc' },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erreur GET categories:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { nom, description } = await request.json();

    if (!nom) {
      return NextResponse.json({ error: 'Le nom de la catégorie est requis' }, { status: 400 });
    }

    const exist = await prisma.categorie.findUnique({ where: { nom } });
    if (exist) {
      return NextResponse.json({ error: 'Une catégorie avec ce nom existe déjà' }, { status: 400 });
    }

    const categorie = await prisma.categorie.create({
      data: { nom, description },
    });

    await logAudit(session.id, 'CREATION_CATEGORIE', 'Categorie', categorie.id, { nom });

    return NextResponse.json(categorie, { status: 201 });
  } catch (error) {
    console.error('Erreur POST categorie:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
