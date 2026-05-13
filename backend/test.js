const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const taskers = await prisma.$queryRaw`SELECT tasker_id, is_online, ST_AsText(current_location) as loc FROM taskers`;
  console.log('Taskers:', taskers);
  const orders = await prisma.orders.findMany({orderBy: {created_at: 'desc'}, take: 1, select: {order_id: true, status: true, tasker_id: true}});
  console.log('Latest Order:', orders);
}
main().finally(() => prisma.$disconnect());
