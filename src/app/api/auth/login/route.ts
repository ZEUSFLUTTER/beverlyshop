import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const result = await authenticate(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Log the login
    if (result.user) {
      await logAudit(result.user.id, 'CONNEXION', 'User', result.user.id);
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
