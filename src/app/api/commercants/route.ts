import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { validateEmail } from '@/lib/utils';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const commercants = await prisma.user.findMany({
      where: { role: Role.COMMERCANT },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        adresse: true,
        compteBancaire: true,
        numeroBancaire: true,
        beneficiaire: true,
        statut: true,
        dateEmbauche: true,
        createdAt: true,
      }
    });

    return NextResponse.json(commercants);
  } catch (error) {
    console.error('Erreur GET commercants:', error);
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
    const { email, nom, prenom, telephone, adresse, compteBancaire, numeroBancaire, beneficiaire } = body;

    if (!email || !nom || !prenom) {
      return NextResponse.json({ error: 'L\'email, le nom et le prénom sont obligatoires' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Format d\'email invalide' }, { status: 400 });
    }

    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà' }, { status: 400 });
    }

    // Default password: 1st letter of First Name + Last Name + 2026 (e.g. JDoe2026)
    const defaultPassword = `${prenom.charAt(0)}${nom}2026!`.replace(/\s+/g, '');
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const commercant = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        telephone,
        adresse,
        compteBancaire,
        numeroBancaire,
        beneficiaire,
        role: Role.COMMERCANT,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        statut: true,
      }
    });

    await logAudit(session.id, 'CREATION_COMMERCANT', 'User', commercant.id, { email });

    return NextResponse.json({
      ...commercant,
      tempPassword: defaultPassword
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST commercant:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
