import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { organization } from 'better-auth/plugins';
import { sendInvitationEmail } from '@/lib/email/send-email';
import { ac, admin, member, owner } from '@/lib/permissions';
import prisma from '@/lib/prisma';

// Validate required Google Auth environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID environment variable is required');
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:3000'],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      prompt: 'select_account',
    },
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
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;

        await sendInvitationEmail({
          email: data.email,
          inviterName: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          organizationName: data.organization.name,
          organizationLogo: data.organization.logo || undefined,
          inviteLink,
        });
      },
      organizationHooks: {
        beforeDeleteOrganization: async (data) => {
          // Count how many organizations the user belongs to
          const memberCount = await prisma.member.count({
            where: {
              userId: data.user.id,
            },
          });

          if (memberCount <= 1) {
            throw new APIError('BAD_REQUEST', {
              message:
                'Cannot delete your only organization. You must have at least one organization.',
            });
          }
        },
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
