import { createAccessControl } from "better-auth/plugins/access";

/**
 * Define document-related permissions
 */
const statement = {
  document: ["create", "read", "update", "delete", "process"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Role definitions for document access
 */
export const member = ac.newRole({
  document: ["create", "read"],
});

export const admin = ac.newRole({
  document: ["create", "read", "update", "process"],
});

export const owner = ac.newRole({
  document: ["create", "read", "update", "delete", "process"],
});