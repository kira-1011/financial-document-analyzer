import { createAccessControl } from "better-auth/plugins/access";
import { 
    defaultStatements, 
    adminAc, 
    memberAc, 
    ownerAc 
} from "better-auth/plugins/organization/access";

/**
 * Define custom permissions extending Better Auth defaults
 */
const statement = {
    ...defaultStatements,
    document: ["create", "read", "update", "delete", "process"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Role definitions - extend default roles with custom permissions
 */
export const member = ac.newRole({
    ...memberAc.statements,
    document: ["create", "read"],
});

export const admin = ac.newRole({
    ...adminAc.statements,
    document: ["create", "read", "update", "process"],
});

export const owner = ac.newRole({
    ...ownerAc.statements,
    document: ["create", "read", "update", "delete", "process"],
});