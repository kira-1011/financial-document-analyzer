import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { organization } from 'better-auth/plugins';
import { ac, admin, member, owner } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  plugins: [
    organization({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
    }),
    nextCookies(),
  ],

  // Database hooks for auto-creating organization
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-create a default organization for new users
          const slug = user.email
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-');

          // Use the internal adapter to create organization directly
          await auth.api.createOrganization({
            body: {
              name: `${user.name}'s Org`,
              slug: `${slug}-${Date.now()}`,
              userId: user.id,
              keepCurrentActiveOrganization: true,
            },
          });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          // Query the user's organization membership
          try {
            const result = await prisma.member.findFirst({
              where: {
                userId: session.userId,
              },
              select: {
                organizationId: true,
              },
            });

            const organizationId = result?.organizationId || null;

            return {
              data: {
                ...session,
                activeOrganizationId: organizationId,
              },
            };
          } catch (error) {
            console.error('Failed to get org for session:', error);
            return { data: session };
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },
});
