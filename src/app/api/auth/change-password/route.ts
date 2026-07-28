import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validate new password
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.id },
      data: { password: hashedPassword, premiereConnexion: false },
    });

    return NextResponse.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur changement mdp:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
