import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/prisma/generated/prisma/client';

// The adapter connects on the first query, not here, so a missing URL must not
// stop this module from loading: `next build` imports every route while
// collecting page data, and Better Auth reads the client's data model at
// startup. Preview builds without DATABASE_URL therefore succeed, and any
// query fails with an error that names the problem.
const MISSING_DATABASE_URL = 'postgresql://DATABASE_URL-is-not-set.invalid:5432/missing';

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set. Database queries will fail.');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString || MISSING_DATABASE_URL }),
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// One client per process. Reusing it through globalThis also survives hot
// reloads in development.
const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
