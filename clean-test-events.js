const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanTestEvents() {
  try {
    console.log('Cleaning test events...');
    
    // Delete all events (since they were just for testing)
    const result = await prisma.event.deleteMany({});
    console.log(`Deleted ${result.count} test events`);
    
    console.log('Test events cleaned successfully!');
    
  } catch (error) {
    console.error('Error cleaning test events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestEvents();
