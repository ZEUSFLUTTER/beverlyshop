import { PrismaClient, Role, StatutUser } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Créer les catégories par défaut
  const categories = [
    { nom: 'Cahiers & Carnets', description: 'Cahiers, carnets, blocs-notes' },
    { nom: 'Stylos & Crayons', description: 'Stylos à bille, feutres, crayons, marqueurs' },
    { nom: 'Papier & Enveloppes', description: 'Ramettes de papier, enveloppes, papier coloré' },
    { nom: 'Classeurs & Rangement', description: 'Classeurs, chemises, pochettes, trieurs' },
    { nom: 'Fournitures de Bureau', description: 'Agrafeuses, perforateurs, trombones, ciseaux' },
    { nom: 'Matériel Scolaire', description: 'Règles, équerres, compas, rapporteurs' },
    { nom: 'Colles & Adhésifs', description: 'Bâtons de colle, scotch, rubans adhésifs' },
    { nom: 'Art & Créativité', description: 'Peinture, pinceaux, papier dessin, crayons de couleur' },
    { nom: 'Informatique & Accessoires', description: 'Clés USB, souris, tapis de souris, câbles' },
    { nom: 'Divers', description: 'Articles divers non classés' },
  ];

  for (const cat of categories) {
    await prisma.categorie.upsert({
      where: { nom: cat.nom },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Catégories créées');

  // Créer l'admin par défaut
  const hashedPassword = await bcrypt.hash('Admin2026!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@boutique.com' },
    update: {},
    create: {
      email: 'admin@boutique.com',
      password: hashedPassword,
      nom: 'Administrateur',
      prenom: 'Principal',
      telephone: '+000000000',
      role: Role.ADMIN,
      statut: StatutUser.ACTIF,
      premiereConnexion: false,
    },
  });
  console.log('✅ Admin créé (admin@boutique.com / Admin2026!)');

  // Créer les paramètres par défaut
  const parametres = [
    { cle: 'commission_pourcent', valeur: '10', description: 'Pourcentage de commission pour les commerçants' },
    { cle: 'seuil_ecart_alerte', valeur: '5', description: 'Seuil d\'écart en pourcentage pour déclencher une alerte' },
    { cle: 'monnaie', valeur: 'FCFA', description: 'Monnaie utilisée pour l\'affichage' },
    { cle: 'session_timeout_minutes', valeur: '30', description: 'Durée d\'inactivité avant déconnexion automatique (minutes)' },
  ];

  for (const param of parametres) {
    await prisma.parametre.upsert({
      where: { cle: param.cle },
      update: {},
      create: param,
    });
  }
  console.log('✅ Paramètres par défaut créés');

  console.log('🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
