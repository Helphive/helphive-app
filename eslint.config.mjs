import tseslint from "typescript-eslint";
import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default tseslint.config(
	// @ts-expect-error Here are the details: https://github.com/typescript-eslint/typescript-eslint/issues/8522#issuecomment-1958191811
	includeIgnoreFile(gitignorePath),
	...tseslint.configs.recommended,
	{
		plugins: {
			"@typescript-eslint": tseslint.plugin,
		},
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: true,
			},
		},
		rules: {
			"@typescript-eslint/no-require-imports": 0,
			"@typescript-eslint/no-explicit-any": 0,
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					varsIgnorePattern: "^_",
					argsIgnorePattern: "^_",
				},
			],
		},
		ignores: ["app.config.js", "babel.config.js", "tailwind.config.js", "my-app.d.ts", "eslint.config.mjs"],
	},
	{
		files: ["**/*.[js,jsx]"],
		...tseslint.configs.disableTypeChecked,
	},
);
