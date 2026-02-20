const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@firma.cz' },
    update: {},
    create: {
      email: 'admin@firma.cz',
      name: 'Admin',
      password: 'admin'
    }
  });
  
  await prisma.page.upsert({
    where: { slug: 'dashboard' },
    update: {},
    create: {
      slug: 'dashboard',
      title: 'Dashboard'
    }
  });
  
  await prisma.page.upsert({
    where: { slug: 'projekty' },
    update: {},
    create: {
      slug: 'projekty',
      title: 'Projekty'
    }
  });
  
  console.log('✅ SEED OK: admin@firma.cz / admin');
}

main().finally(() => prisma.$disconnect());
