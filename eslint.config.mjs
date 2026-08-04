import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "coverage/**",
    "public/**",
    "next-env.d.ts",
    ".agents/**",
  ]),
  {
    // Mocks de testes usam `as any` por idioma (shapes de Prisma/fetch/SSE).
    files: ["src/__tests__/**/*.{ts,tsx}", "src/__tests__/helpers/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    rules: {
      // Parâmetros não utilizados iniciados com `_` são intencionais
      // (ex.: implementações de interface como localStorage.key).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
