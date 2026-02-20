const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestEvent() {
  try {
    console.log('Creating test event...');
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: 'Roman.Svobodnik@itman.cz' }
    });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    // Create a test event
    const event = await prisma.event.create({
      data: {
        title: 'Test událost',
        description: 'Toto je testovací událost vytvořená pro ověření funkčnosti kalendáře',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours
        type: 'MEETING',
        allDay: false,
        ownerId: user.id
      }
    });
    
    console.log('Test event created:', event);
    
    // Create another test event for tomorrow
    const tomorrowEvent = await prisma.event.create({
      data: {
        title: 'Zítra schůzka',
        description: 'Testovací schůzka na zítra',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day
        endDate: new Date(Date.now() + 26 * 60 * 60 * 1000), // +1 day + 2 hours
        type: 'PROJECT',
        allDay: false,
        ownerId: user.id
      }
    });
    
    console.log('Tomorrow event created:', tomorrowEvent);
    
    console.log('\nTest events created successfully!');
    
  } catch (error) {
    console.error('Error creating test event:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestEvent();
