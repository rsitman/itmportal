const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEvents() {
  try {
    console.log('Checking database events...');
    
    // Check total events count
    const totalEvents = await prisma.event.count();
    console.log('Total events in database:', totalEvents);
    
    // Check users
    const users = await prisma.user.findMany();
    console.log('Users in database:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
    // Check events with details
    if (totalEvents > 0) {
      const events = await prisma.event.findMany({
        include: {
          owner: true
        }
      });
      
      console.log('\nEvents details:');
      events.forEach(event => {
        console.log(`- ${event.title} (${event.id})`);
        console.log(`  Owner: ${event.owner?.email || 'None'}`);
        console.log(`  Type: ${event.type}`);
        console.log(`  Is ERP: ${event.isErpEvent}`);
        console.log(`  Start: ${event.startDate}`);
        console.log(`  End: ${event.endDate}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error checking events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvents();
