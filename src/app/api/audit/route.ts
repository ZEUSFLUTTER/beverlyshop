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
    const action = searchParams.get('action');
    const take = parseInt(searchParams.get('take') || '100');

    const where: any = {};
    if (action) {
      where.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { nom: true, prenom: true, role: true } }
      }
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Erreur GET audit:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
