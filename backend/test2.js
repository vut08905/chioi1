const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const taskers = await prisma.$queryRaw`SELECT tasker_id, is_online, ST_AsText(current_location) as loc FROM taskers`;
  console.log('Taskers in DB:', taskers);
}
main().finally(() => prisma.$disconnect());
