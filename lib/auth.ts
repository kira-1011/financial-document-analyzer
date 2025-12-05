import { betterAuth } from "better-auth";
import { organization, } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { ac, owner, admin, member } from "@/lib/permissions";
import { headers } from "next/headers";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      accessControl: ac,
      roles: {
        owner,
        admin,
        member,
      },
      sendInvitationEmail: async (data) => {
        // For now, just log - implement email later
        console.log("Invitation email:", {
          email: data.email,
          inviter: data.inviter.user.name,
          organization: data.organization.name,
          inviteLink: `${process.env.BETTER_AUTH_URL}/invite/${data.id}`,
        });

        // TODO: Implement actual email sending with Resend
        // await sendEmail({
        //   to: data.email,
        //   subject: `You've been invited to ${data.organization.name}`,
        //   html: `...`
        // });
      },
    }),

    nextCookies(), // This handles cookies automatically in Next.js!
  ],
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          const slug = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
          await auth.api.createOrganization({
            body: {
              name: `${user.name}'s Organization`,
              slug,
              userId: user.id,
            },
            headers: await headers(),
          });
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


