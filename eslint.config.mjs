import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      // Build and generated files
      ".next/**/*",
      "out/**/*",
      "dist/**/*",

      // PWA generated files
      "public/sw.js",
      "public/workbox-*.js",

      // Node modules and other standard ignores
      "node_modules/**/*",
      ".env*",

      // Test coverage
      "coverage/**/*",
    ],
  },
];

export default eslintConfig;
