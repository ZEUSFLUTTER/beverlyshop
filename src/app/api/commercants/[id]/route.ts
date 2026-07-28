import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { StatutUser } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const id = (await params).id;
    const body = await request.json();
    const { nom, prenom, telephone, adresse, compteBancaire, numeroBancaire, beneficiaire, statut, resetPassword } = body;

    const updateData: any = {
      nom, prenom, telephone, adresse, compteBancaire, numeroBancaire, beneficiaire,
    };

    if (statut && Object.values(StatutUser).includes(statut as StatutUser)) {
      updateData.statut = statut as StatutUser;
    }

    let tempPassword = null;
    if (resetPassword) {
      tempPassword = `${prenom.charAt(0)}${nom}2026!`.replace(/\s+/g, '');
      updateData.password = await bcrypt.hash(tempPassword, 12);
      updateData.premiereConnexion = true;
    }

    const commercant = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        statut: true,
      }
    });

    await logAudit(session.id, 'MODIFICATION_COMMERCANT', 'User', id);

    return NextResponse.json(tempPassword ? { ...commercant, tempPassword } : commercant);
  } catch (error) {
    console.error('Erreur PUT commercant:', error);
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

    // First, delete all related records:
    // 1. Delete all sales (Vente) linked to this commercant
    await prisma.vente.deleteMany({ where: { commercantId: id } });
    // 2. Delete all attribution articles linked to attributions of this commercant
    await prisma.attributionArticle.deleteMany({
      where: {
        attribution: {
          commercantId: id } } });
    // 3. Delete all attributions of this commercant
    await prisma.attribution.deleteMany({ where: { commercantId: id } });
    // 4. Delete audit logs for this user (optional but clean)
    // 5. Finally delete the user
    await prisma.user.delete({ where: { id } });

    await logAudit(session.id, 'SUPPRESSION_COMMERCANT', 'User', id);

    return NextResponse.json({ success: true, message: 'Commerçant et toutes ses données ont été supprimés.' });
  } catch (error) {
    console.error('Erreur DELETE commercant:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
