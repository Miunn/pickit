import { createAccessControl } from "better-auth/plugins";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

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
	user: ["get", "update"],
	// ...userAc.statements,
});

export const admin = ac.newRole({
	...adminAc.statements,
	folder: ["create", "read", "update", "delete", "share"],
	file: ["create", "read", "update", "delete", "share"],
	comment: ["create", "read", "update", "delete"],
});
