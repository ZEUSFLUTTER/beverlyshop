import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const parametres = await prisma.parametre.findMany({
      orderBy: { cle: 'asc' }
    });

    return NextResponse.json(parametres);
  } catch (error) {
    console.error('Erreur GET parametres:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parametres = body.parametres; // Array of { cle, valeur }

    if (!Array.isArray(parametres)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    }

    await prisma.$transaction(
      parametres.map((p) =>
        prisma.parametre.update({
          where: { cle: p.cle },
          data: { valeur: p.valeur }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PUT parametres:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
