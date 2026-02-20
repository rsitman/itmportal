const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Hash admin password
  const hashedPassword = await bcrypt.hash('admin123', 12)

  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@firma.cz' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      authProvider: 'LOCAL',
      isActive: true
    },
    create: {
      email: 'admin@firma.cz',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      authProvider: 'LOCAL',
      isActive: true
    }
  })
  console.log('✅ Admin user created/updated (admin@firma.cz / admin123)')

  // Dashboard page
  await prisma.page.upsert({
    where: { slug: 'dashboard' },
    update: {},
    create: {
      slug: 'dashboard',
      title: 'Dashboard'
    }
  })
  console.log('✅ Dashboard page OK')

  // Projekty page
  await prisma.page.upsert({
    where: { slug: 'projekty' },
    update: {},
    create: {
      slug: 'projekty',
      title: 'Projekty'
    }
  })
  console.log('✅ Projekty page OK')

  // Users page
  await prisma.page.upsert({
    where: { slug: 'users' },
    update: {},
    create: {
      slug: 'users',
      title: 'Uživatelé'
    }
  })
  console.log('✅ Users page OK')
  console.log('🎉 SEED DOKONČEN!')
}

main()
  .catch(e => {
    console.error('❌ Error:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })