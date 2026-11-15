import { createServerFnIdGenerator } from "#/utils/server-fn-id.ts";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { defineConfig, lazyPlugins } from "vite-plus";

loadDotenv({ path: [".env.local", ".env"] });
const appVersion = process.env.APP_VERSION || "dev";

const port = Number.parseInt(process.env.PORT ?? "3000", 10) || 3000;

const generated = ["src/routeTree.gen.ts"];
const vendoredSkills = [".agents/skills/**", ".claude/skills/**"];

const config = defineConfig({
  staged: {
    "*": "vp check --fix",
  },

  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@data": path.resolve(import.meta.dirname, "./data"),
    },
  },

  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },

  fmt: {
    ignorePatterns: ["pnpm-lock.yaml", ".claude/worktrees/**", ...vendoredSkills, ...generated],
    semi: true,
    trailingComma: "all",
    sortPackageJson: false,
  },

  lint: {
    ignorePatterns: ["dist/**", ".tanstack/**", ...vendoredSkills, ...generated],
    plugins: ["react", "import", "typescript"],
    jsPlugins: [
      "@shadcn/lint",
      "./scripts/oxlint-ui-plugin.mjs",
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
    ],
    settings: {
      shadcn: {
        note: "A colour, radius or state comes from a token or a variant; className is for layout (docs/agents/style-guide.md). A new token or variant is a product decision: ask before adding one.",
      },
    },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "shadcn/no-restyle": [
        "error",
        {
          allow: ["layout"],
          // A card's content lays out its children; its padding stays the card's.
          contracts: [{ pattern: "^CardContent$", allow: ["layout", "gap-*"] }],
        },
      ],
      "shadcn/no-raw-colors": "error",
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-unknown-classes": "error",
      "shadcn/no-inline-styles": "error",
      "shadcn/require-static-classes": "error",
      "ui/alert-structure": "error",
      "ui/no-bare-label": "error",
      "ui/no-raw-date-format": "error",
      "ui/no-raw-empty": "error",
      "ui/no-raw-form": "error",
      "ui/no-raw-form-element": "error",
      "ui/no-raw-page-title": "error",
      "ui/no-raw-table": "error",
      "ui/no-uncontrolled-input": "error",
      "ui/require-no-validate": "error",
      "ui/require-post-method": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "import/no-cycle": "error",
      "typescript/no-floating-promises": ["error", { checkThenables: true }],
      "typescript/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
    },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ["src/components/ui/**"],
        rules: {
          "shadcn/no-restyle": "off",
          "shadcn/no-arbitrary-values": "off",
          "shadcn/require-static-classes": "off",
          "ui/no-bare-label": "off",
          "ui/no-raw-date-format": "off",
          "ui/no-raw-form-element": "off",
          "ui/no-raw-table": "off",
        },
      },
      {
        files: [
          "src/components/form-page.tsx",
          "src/components/patient-form.tsx",
          "src/routes/ingresar.tsx",
          "src/routes/_app/cambiar-contrasena.tsx",
          "src/routes/_app/disponibilidad/index.tsx",
          "src/routes/_app/conversaciones/-hold.tsx",
          "src/routes/_app/whatsapp/configuracion/prueba.tsx",
          "**/*.test.tsx",
        ],
        rules: {
          "ui/no-raw-form": "off",
          "ui/no-uncontrolled-input": "off",
        },
      },
      {
        files: ["src/lib/dates.ts"],
        rules: { "ui/no-raw-date-format": "off" },
      },
      {
        files: ["src/components/empty-state.tsx"],
        rules: { "ui/no-raw-empty": "off" },
      },
      {
        files: ["src/components/data-table.tsx"],
        rules: { "ui/no-raw-table": "off" },
      },
      {
        files: ["src/components/page-header.tsx"],
        rules: { "ui/no-raw-page-title": "off" },
      },
      {
        files: ["**/*.test.tsx"],
        rules: {
          "shadcn/no-restyle": "off",
          "ui/no-raw-form-element": "off",
        },
      },
    ],
  },

  build: {
    rolldownOptions: {
      experimental: { lazyBarrel: true },
      output: {
        codeSplitting: {
          groups: [
            { name: "react-vendor", test: /node_modules\/(react|react-dom)/ },
            { name: "router", test: /node_modules\/@tanstack\/react-router/ },
            { name: "query", test: /node_modules\/@tanstack\/(query|db)/ },
            { name: "three", test: /node_modules\/(three|@react-three)\// },
            { name: "charts", test: /node_modules\/(recharts|d3-|@tanstack\/charts)/ },
            { name: "shiki", test: /node_modules\/(shiki|highlight\.js)/ },
            { name: "table-form", test: /node_modules\/@tanstack\/(react-table|react-form)/ },
            { name: "ai", test: /node_modules\/@tanstack\/ai/ },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },

  ssr: {
    external: [
      "lucide-react",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "@react-three/rapier",
    ],
  },

  server: {
    port,
    strictPort: true,
    host: true,
    hmr: process.env.DISABLE_HMR !== "true",
    allowedHosts: ["localhost", "127.0.0.1"],
    watch: {
      ignored: [
        "**/e2e/.auth/**",
        "**/e2e/results/**",
        "**/playwright-report/**",
        "**/test-results/**",
      ],
    },
  },

  plugins: lazyPlugins(() => [
    devtools({ consolePiping: { enabled: false } }),
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true },
      prerender: { filter: () => false },
      srcDirectory: "src",
      router: { routesDirectory: "routes" },
      serverFns: { generateFunctionId: createServerFnIdGenerator() },
      server: { build: { staticNodeEnv: false } },
    }),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ]),

  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "src/**/*.test.{ts,tsx}",
            "scripts/**/*.test.ts",
            "tests/lint/**/*.test.ts",
            "tests/evals/**/*.test.ts",
          ],
          exclude: ["**/*.workers.test.ts", "node_modules/**"],
          environment: "node",
        },
      },
    ],
  },
});

export default config;
