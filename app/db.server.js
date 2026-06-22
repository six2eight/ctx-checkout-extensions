import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot reloads in development.
const prisma = global.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

export default prisma;
