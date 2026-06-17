const { PrismaClient } = require('@prisma/client');

// Singleton pattern — reuse client across modules
let prisma;

if (!global.__prisma) {
  global.__prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });
}

prisma = global.__prisma;

module.exports = prisma;
