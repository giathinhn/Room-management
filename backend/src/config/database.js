const { PrismaClient } = require('@prisma/client');

if (!global.__prisma) {
  global.__prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });
}

const prisma = global.__prisma;

module.exports = prisma;
