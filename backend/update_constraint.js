require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'SEARCHING', 'ACCEPTED', 'TASKER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));`);
    console.log('Constraint updated successfully');
  } catch (e) {
    console.error('Error updating constraint:', e);
  }
}

main().finally(() => prisma.$disconnect());
