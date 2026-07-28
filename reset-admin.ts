import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin2026!', 12);
  
  // Try update first
  const result = await prisma.user.updateMany({
    where: { email: 'admin@boutique.com' },
    data: { password: hash, statut: 'ACTIF' }
  });
  
  console.log('Updated:', result.count, 'user(s)');
  
  if (result.count === 0) {
    // Create admin if not found
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@boutique.com',
        password: hash,
        nom: 'Administrateur',
        prenom: 'Principal',
        telephone: '+000000000',
        role: 'ADMIN',
        statut: 'ACTIF',
        premiereConnexion: false
      }
    });
    console.log('Created admin:', newAdmin.id);
  }
  
  // Verify
  const admin = await prisma.user.findUnique({ where: { email: 'admin@boutique.com' } });
  console.log('Admin found:', admin ? 'YES' : 'NO');
  console.log('Admin statut:', admin?.statut);
  console.log('Admin role:', admin?.role);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
