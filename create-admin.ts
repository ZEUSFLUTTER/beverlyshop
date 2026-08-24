import { PrismaClient, Role, StatutUser } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Création du compte administrateur...');

  // Hash du mot de passe
  const hashedPassword = await bcrypt.hash('admin789', 12);

  // Créer ou mettre à jour l'administrateur
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
      statut: StatutUser.ACTIF,
      premiereConnexion: false,
    },
    create: {
      email: 'admin@gmail.com',
      password: hashedPassword,
      nom: 'Admin',
      prenom: 'Principal',
      telephone: '+000000000',
      role: Role.ADMIN,
      statut: StatutUser.ACTIF,
      premiereConnexion: false,
    },
  });

  console.log('✅ Compte administrateur créé avec succès !');
  console.log('📧 Email:', admin.email);
  console.log('👤 Nom:', admin.nom, admin.prenom);
  console.log('🔑 Rôle:', admin.role);
  console.log('📊 Statut:', admin.statut);
  console.log('\n🎉 Vous pouvez maintenant vous connecter avec :');
  console.log('   Email: admin@gmail.com');
  console.log('   Mot de passe: admin789');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la création du compte:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
