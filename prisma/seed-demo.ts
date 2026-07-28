import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data for dashboard...');

  const categorie = await prisma.categorie.findFirst();
  if (!categorie) {
    console.log('No categorie found');
    return;
  }

  const user = await prisma.user.findFirst({ where: { role: 'COMMERCANT' } });
  let commercantId = user?.id;
  if (!user) {
    const newCommercant = await prisma.user.create({
      data: {
        nom: 'Doe',
        prenom: 'John',
        email: 'john@commercant.com',
        password: 'password',
        role: 'COMMERCANT'
      }
    });
    commercantId = newCommercant.id;
  }

  // Create articles
  const articlesData = [
    { code: 'ART-001', libelle: 'Cahier 100 pages', prixUnitaire: 500, quantiteStock: 100, seuilAlerte: 10, categorieId: categorie.id },
    { code: 'ART-002', libelle: 'Stylo Bleu', prixUnitaire: 100, quantiteStock: 200, seuilAlerte: 20, categorieId: categorie.id },
    { code: 'ART-003', libelle: 'Rame de papier', prixUnitaire: 2500, quantiteStock: 50, seuilAlerte: 5, categorieId: categorie.id },
    { code: 'ART-004', libelle: 'Sac à dos', prixUnitaire: 15000, quantiteStock: 5, seuilAlerte: 5, categorieId: categorie.id },
  ];

  for (const a of articlesData) {
    await prisma.article.upsert({
      where: { code: a.code },
      update: {},
      create: a
    });
  }

  const articles = await prisma.article.findMany();

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  // Create an attribution
  const attribution = await prisma.attribution.create({
    data: {
      commercant: { connect: { id: commercantId } },
      admin: { connect: { id: admin?.id } },
      statut: 'EN_COURS',
      articles: {
        create: [
          { articleId: articles[0].id, quantiteAttribuee: 50, prixUnitaireSnapshot: 500 },
          { articleId: articles[1].id, quantiteAttribuee: 100, prixUnitaireSnapshot: 100 },
        ]
      }
    }
  });

  // Create sales
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const saleDate = new Date();
    saleDate.setDate(today.getDate() - i);
    
    await prisma.vente.create({
      data: {
        commercant: { connect: { id: commercantId } },
        article: { connect: { id: articles[0].id } },
        attribution: { connect: { id: attribution.id } },
        quantiteVendue: 5 + i,
        prixUnitaireVente: 500,
        montantTotal: (5 + i) * 500,
        dateVente: saleDate
      }
    });
  }

  console.log('✅ Demo data generated!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
