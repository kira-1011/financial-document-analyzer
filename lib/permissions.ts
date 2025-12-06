import { createAccessControl } from "better-auth/plugins/access";

/**
 * Define permissions for documents AND organization
 */
const statement = {
  document: ["create", "read", "update", "delete", "process"],
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Role definitions
 */
export const member = ac.newRole({
  document: ["create", "read"],
  // Members can't manage org/members/invitations
});

export const admin = ac.newRole({
  document: ["create", "read", "update", "process"],
  organization: ["update"],
  member: ["create", "update"],
  invitation: ["create", "cancel"],
});

export const owner = ac.newRole({
  document: ["create", "read", "update", "delete", "process"],
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});