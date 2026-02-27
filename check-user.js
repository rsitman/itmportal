const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email: 'admin@firma.cz' } 
    });
    
    if (user) {
      console.log('User found:', user.email);
      console.log('Role:', user.role);
      console.log('Provider:', user.authProvider);
      console.log('Password exists:', !!user.password);
      console.log('Is active:', user.isActive);
      console.log('User ID:', user.id);
    } else {
      console.log('User NOT found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
