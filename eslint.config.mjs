import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Saídas geradas por Storybook e testes.
    "storybook-static/**",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
    "coverage/**",
  ]),
  {
    // O gráfico de ECharts guarda o estado imperativo do canvas num ref único e
    // o lê durante o render — é o desenho da biblioteca, que chega pronta pelo
    // registry do EvilCharts e é reinstalada por lá. Reescrever isso seria
    // refazer a lib; a regra continua valendo para todo o resto do projeto.
    files: ["components/evilcharts/charts/echarts-*.tsx"],
    rules: { "react-hooks/refs": "off" },
  },
]);

export default eslintConfig;
