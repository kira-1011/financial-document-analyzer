import { betterAuth } from "better-auth";
import { organization, } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { ac, owner, admin, member } from "@/lib/permissions";
import { sendInvitationEmail } from "@/lib/email/send-email";

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
      // Optional: Add cleanup before deletion
      beforeDelete: async (user) => {
        console.log(`Deleting user: ${user.email}`);
        // Add any cleanup logic (e.g., delete user's documents, org cleanup)
      },
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
          const slug = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");

          // Use the internal adapter to create organization directly
          const org = await auth.api.createOrganization({
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
            console.error("Failed to get org for session:", error);
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
