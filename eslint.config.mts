import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

/**
 * Consolidated ESLint configuration
 *
 * - Single consolidated `no-restricted-imports` rule that:
 *   - bans relative imports (./ ../) across the codebase
 *   - bans direct `slugify` imports (prefer internal SlugService)
 *   - bans direct imports of `@/lib/prisma` outside the DAL
 *
 * - Narrow overrides that explicitly disable `no-restricted-imports` for files
 *   that should be allowed to use relative imports or Prisma (DAL, specific
 *   service files, etc.). These overrides are intentionally precise to avoid
 *   accidentally clobbering the global rule.
 */
const eslintConfig = [
	...compat.config({
		extends: ["next/core-web-vitals", "next/typescript", "prettier"],
	}),

	globalIgnores(["node_modules/", ".next/"]),

	// Main rules applied to source files
	{
		files: ["src/**/*.{js,ts,jsx,tsx}"],
		rules: {
			"react-hooks/rules-of-hooks": "off",
			eqeqeq: ["error"],
			"react/prefer-read-only-props": "error",

			// Consolidated restricted imports
			"no-restricted-imports": [
				"error",
				{
					// Specific path-based restrictions
					paths: [
						{
							name: "@/lib/prisma",
							message: "Please use the prisma client only from the Data Access Layer (src/lib/services) directory. Use DAL functions instead.",
						},
					],
					// Glob patterns for disallowed imports (include relative imports)
					patterns: [
						// relative imports (same directory and parent directory, recursive)
						"./*",
						"./**",
						"../*",
						"../**",

						// package-level restrictions
						"slugify",
						"slugify/*",
					],
				},
			],
		},
	},

	// Narrow exceptions: files/folders allowed to use relative imports or import prisma directly.
	// Keep these overrides specific to avoid accidentally disabling the rule globally.
	{
		files: [
			// API auth route handlers (can use relative imports for local utilities)
			"src/app/api/auth/**/*.{js,ts,jsx,tsx}",

			// Internal data layer files that intentionally use relative imports
			"src/data/**/*.{js,ts,jsx,tsx}",

			// The internal slug service is allowed to import slugify if necessary
			"src/data/slug-service.ts",

			// Styles layout
			"src/app/layout.tsx",
		],
		rules: {
			"no-restricted-imports": "off",
		},
	},

	// File-specific tweaks
	{
		files: ["src/lib/definitions.ts"],
		rules: {
			"@typescript-eslint/no-unused-vars": "off",
		},
	},
];

export default eslintConfig;
