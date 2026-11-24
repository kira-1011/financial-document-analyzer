import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Same files Next.js reads, so one .env.local serves both.
config({ path: ['.env.local', '.env'], quiet: true });

// Migrations use Neon's direct (unpooled) connection, which neon deploy
// writes as DATABASE_URL_UNPOOLED. `prisma generate` does
// not connect, so a missing URL only matters for migrate commands.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url:
      process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '',
  },
});
