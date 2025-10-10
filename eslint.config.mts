import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.config({
        extends: ["next/core-web-vitals", "next/typescript", "prettier"],
    }),
    {
        /* Global rules */
        files: ["src/**/*.{js,ts,jsx,tsx}"],
        rules: {
            "react-hooks/rules-of-hooks": "off",
            eqeqeq: ["error"],
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [".*"],
                            message: "Usage of relative parent imports is not allowed.",
                        },
                    ],
                },
            ],
        },
    },
    {
        /* Rules to enforce the use of the DAL (no ORM import outside of DAL) */
        files: ["src/**/*.{js,ts,jsx,tsx}"],
        ignores: ["src/app/api/auth/**/*.{js,ts,jsx,tsx}", "src/data/**/*.{js,ts,jsx,tsx}", "src/lib/prisma.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    paths: [
                        {
                            name: "@/lib/prisma",
                            message:
                                "Please use the prisma client only from the Data Access Layer (src/lib/services) directory. Use DAL functions instead.",
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ["src/lib/definitions.ts"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
];

export default eslintConfig;
