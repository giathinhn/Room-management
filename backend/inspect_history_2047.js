const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'admin@company.com' } });
  const messages = await prisma.chatMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  messages.reverse().forEach((msg) => {
    console.log(`\n[${msg.createdAt.toISOString()}] [${msg.role.toUpperCase()}]: ${msg.content}`);
    if (msg.metadata) {
      console.log('Metadata:', JSON.stringify(msg.metadata, null, 2));
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
