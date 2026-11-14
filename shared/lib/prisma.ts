import { PrismaClient } from '@prisma/client'

declare global {
  // Prevent multiple instances of Prisma Client in development
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = globalThis.prisma ?? new PrismaClient({
  log: ['error'],
})

// In development, save the Prisma Client instance globally to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Function to disconnect Prisma client
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export default prisma
