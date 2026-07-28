import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        statut: true,
        dateEmbauche: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erreur GET profile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { nom, prenom, telephone } = body;

    if (!nom?.trim() || !prenom?.trim()) {
      return NextResponse.json({ error: 'Le nom et le prénom sont obligatoires' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        statut: true,
      },
    });

    // Rafraîchit la session pour refléter le nouveau nom/prénom
    await createSession({
      id: updated.id,
      email: updated.email,
      nom: updated.nom,
      prenom: updated.prenom,
      role: updated.role,
      statut: updated.statut,
      premiereConnexion: session.premiereConnexion,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Erreur PUT profile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
