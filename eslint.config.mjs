import typescriptEslint from "@typescript-eslint/eslint-plugin";
import unusedImports from "eslint-plugin-unused-imports";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [
	...compat.extends(
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/stylistic"
	),
	{
		plugins: {
			"@typescript-eslint": typescriptEslint,
			"unused-imports": unusedImports,
		},

		languageOptions: {
			parser: tsParser,
			ecmaVersion: "latest",
			sourceType: "module",
		},

		rules: {
			"no-debugger": "off",
			"@typescript-eslint/no-unused-vars": "warn",
			"unused-imports/no-unused-imports": "warn",

			"unused-imports/no-unused-vars": [
				"warn",
				{
					vars: "all",
					varsIgnorePattern: "^_",
					args: "after-used",
					argsIgnorePattern: "^_",
				},
			],

			eqeqeq: "error",
			"no-use-before-define": "warn",
		},
	},
];
