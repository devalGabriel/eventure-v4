const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = ['ADMIN', 'CLIENT', 'PROVIDER'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log('Seeded roles:', roles.join(', '));
}

main().finally(()=>prisma.$disconnect());
