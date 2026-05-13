const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = 11;
  const status = 'TASKER_ARRIVED';
  
  try {
    const updatedOrder = await prisma.orders.update({
      where: { order_id: orderId },
      data: { status },
    });
    console.log('Update success:', updatedOrder);
  } catch (e) {
    console.error('Update failed:', e);
  }
}

main().finally(() => prisma.$disconnect());
