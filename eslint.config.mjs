import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
    {files: ["**/*.{js,mjs,cjs,ts}"]},
    {languageOptions: {globals: globals.browser}},
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: [
            "docs/**",
            "examples/**/*.js"
        ]
    },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    args: 'after-used',
                    ignoreRestSiblings: true,
                    argsIgnorePattern: '^_',  // Ignore unused variables in function arguments if they start with "_"
                    varsIgnorePattern: '^_'   // Ignore unused variables if they start with "_"
                }
            ]
        }
    }
];
