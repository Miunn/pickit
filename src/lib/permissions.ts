import { createAccessControl } from "better-auth/plugins";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";

const statements = {
	...defaultStatements,
	folder: ["create", "read", "update", "delete", "share"],
	file: ["create", "read", "update", "delete", "share"],
	comment: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statements);

export const user = ac.newRole({
	folder: ["create", "read", "update", "delete", "share"],
	file: ["create", "read", "update", "delete", "share"],
	comment: ["create", "read", "update", "delete"],
	...userAc.statements,
});

export const admin = ac.newRole({
	folder: ["create", "read", "update", "delete", "share"],
	file: ["create", "read", "update", "delete", "share"],
	comment: ["create", "read", "update", "delete"],
	...adminAc.statements,
});
