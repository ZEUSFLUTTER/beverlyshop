import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'super-secret-key-inv-boutique-2026'
);

const SESSION_COOKIE = 'inv-session';
const SESSION_DURATION = 30 * 60; // 30 minutes in seconds

export interface SessionUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'ADMIN' | 'COMMERCANT';
  statut: string;
  premiereConnexion: boolean;
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    statut: user.statut,
    premiereConnexion: user.premiereConnexion,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function authenticate(
  email: string,
  password: string
): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    if (user.statut !== 'ACTIF') {
      return { success: false, error: 'Votre compte est désactivé. Contactez l\'administrateur.' };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      statut: user.statut,
      premiereConnexion: user.premiereConnexion,
    };

    await createSession(sessionUser);
    return { success: true, user: sessionUser };
  } catch (error) {
    console.error('Erreur authentification:', error);
    return { success: false, error: 'Erreur serveur. Veuillez réessayer.' };
  }
}
