import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, owner, admin, member } from "./permissions";

export const authClient = createAuthClient({
  plugins: [organizationClient({
    ac,
    roles: {
      owner,
      admin,
      member,
    },
  })],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
  useListOrganizations,
  useActiveOrganization,
} = authClient;

