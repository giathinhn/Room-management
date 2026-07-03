const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { email: true } } },
  });

  console.log(`--- Total messages in DB: ${messages.length} ---`);
  messages.forEach((msg) => {
    console.log(`\n[${msg.createdAt.toISOString()}] [User: ${msg.user.email}] [${msg.role.toUpperCase()}]: ${msg.content.substring(0, 100)}`);
    if (msg.metadata) {
      console.log('Metadata action:', msg.metadata.action);
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
