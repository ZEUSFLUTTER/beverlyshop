import { PrismaClient, Role, StatutUser } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Créer les catégories par défaut
  const categories = [
    { nom: 'Alimentation', description: 'Boissons, conserves, snacks, épicerie' },
    { nom: 'Produits d\'entretien', description: 'Lessive, savons, nettoyants ménagers' },
    { nom: 'Beauté & Hygiène', description: 'Shampooing, dentifrice, déodorant, soins' },
    { nom: 'Électronique', description: 'Piles, câbles, petits appareils, accessoires' },
    { nom: 'Quincaillerie', description: 'Petits outils, visserie, accessoires' },
    { nom: 'Articles ménagers', description: 'Ustensiles de cuisine, décoration, petit mobilier' },
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
