import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { organization } from 'better-auth/plugins';
import { Pool } from 'pg';
import { sendInvitationEmail } from '@/lib/email/send-email';
import { ac, admin, member, owner } from '@/lib/permissions';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
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
            const result = await pool.query(
              `SELECT "organizationId" FROM member WHERE "userId" = $1 LIMIT 1`,
              [session.userId]
            );

            const organizationId = result.rows[0]?.organizationId || null;

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
