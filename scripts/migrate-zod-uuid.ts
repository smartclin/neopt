#!/usr/bin/env bun
/**
 * Migrate deprecated `z.string().uuid()` chains to `z.uuid()` (Zod 4+).
 *
 * Handles:
 *   z.string().uuid()                 → z.uuid()
 *   z.string().uuid("message")        → z.uuid("message")
 *   z.string().trim().uuid()          → z.string().trim().pipe(z.uuid())
 *   z.string().uuid().optional()      → z.uuid().optional()
 *   z.string().uuid().nullable()      → z.uuid().nullable()
 *   z.string().min(1).uuid()          → z.string().min(1).pipe(z.uuid())
 *   z.string().uuid().or(z.literal(""))→ z.uuid().or(z.literal(""))
 *
 * Skips:
 *   - node_modules, .git, dist, build, .output, routeTree.gen.ts
 *   - z.string().email(), z.string().url(), etc. (only .uuid() is targeted)
 *   - Files where `z` is not the zod import (best-effort import check)
 *
 * Usage:
 *   bun scripts/migrate-zod-uuid.ts          # dry-run (default)
 *   bun scripts/migrate-zod-uuid.ts --write  # apply changes
 *   bun scripts/migrate-zod-uuid.ts --write --path src
 */

import { glob, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const ROOT = resolve(process.cwd());

const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/scripts/**",
  "**/data/**",
  "**/build/**",
  "**/.output/**",
  "**/.tanstack/**",
  "**/routeTree.gen.ts",
  "**/*.d.ts",
];

const APPLY = process.argv.includes("--write");
const PATH_ARG = process.argv.indexOf("--path");
const SEARCH_ROOT =
  PATH_ARG !== -1 && process.argv[PATH_ARG + 1] ? resolve(ROOT, process.argv[PATH_ARG + 1]) : ROOT;

// ---------------------------------------------------------------------------
// Regex-based rewriting
// ---------------------------------------------------------------------------
//
// We match the *full chain* from `z.string()` up through `.uuid()` (inclusive)
// so that:
//   - nothing between `.string()` and `.uuid()` is lost
//   - `.optional()`, `.nullable()`, etc. that come *after* `.uuid()` are
//     preserved because they're outside the match
//
// Character classes:
//   [^;]*?  — lazy: never cross a statement boundary. Safe for single-line
//             and multi-line chains (doesn't stop at newlines).
//
// The pattern is intentionally conservative: if the chain contains another
// method that returns a ZodString (e.g., `.trim()`, `.min()`), we can't
// rewrite `.uuid()` into `z.uuid()` in place — we emit a `.pipe(z.uuid())`
// fallback instead, preserving the earlier string transforms.

/**
 * Case 1 — simple chain (no intermediate string-transform methods):
 *   z.string().uuid(...)          → z.uuid(...)
 *   z.string()\n  .uuid(...)      → z.uuid(...)
 *
 * Intermediate methods that *do* return a ZodString (trim, min, max, regex,
 * length, startsWith, endsWith, includes, toLowerCase, toUpperCase, nonempty,
 * datetime, ip, emoji, etc.) force Case 2.
 */
const SIMPLE_CHAIN = /\bz\s*\.\s*string\s*\(\s*\)\s*\.\s*uuid\s*\(([^)]*)\)/g;

/**
 * Case 2 — chain with intermediate string refinements:
 *   z.string().trim().uuid("msg")     → z.string().trim().pipe(z.uuid("msg"))
 *
 * We only fire if there is at least one method between `.string()` and
 * `.uuid()`. The captured "pre" part is everything from `z.string()` up to
 * (but not including) `.uuid(`.
 */
const CHAINED =
  /\bz\s*\.\s*string\s*\(\s*\)((?:\s*\.\s*[a-zA-Z_$][\w$]*\s*\([^)]*\))+?)\s*\.\s*uuid\s*\(([^)]*)\)/g;

/**
 * Case 3 — `z.string().uuid()` with zero args and no trailing refinements,
 *          used as part of a larger expression. Handled by Case 1 above.
 *
 * Note: we do NOT touch `z.string().email()` / `.url()` / `.cuid()` etc.
 * because they may still be valid in Zod 4 depending on exact version.
 * This migration is *only* about the deprecated `.uuid()` chain.
 */

type Rewrite = {
  before: string;
  after: string;
  line: number;
};

function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) if (source.charCodeAt(i) === 10) line++;
  return line;
}

function rewrite(source: string): { output: string; rewrites: Rewrite[] } {
  const rewrites: Rewrite[] = [];

  // First pass: Case 2 (chained) so we don't accidentally match the
  // `.uuid()` inside an already-transformed Case-1 result. Both patterns
  // are anchored on `z.string()`, so a correct application order is:
  //   Case 2 first (longest), then Case 1.
  let output = source.replace(CHAINED, (_match, pre: string, args: string) => {
    const before = `${_match}`.trim();
    const after = `z.string()${pre}.pipe(z.uuid(${args}))`;
    rewrites.push({ before, after, line: 0 });
    return after;
  });

  // Second pass: Case 1 (simple)
  output = output.replace(SIMPLE_CHAIN, (_match, args: string) => {
    const after = `z.uuid(${args})`;
    rewrites.push({ before: _match, after, line: 0 });
    return after;
  });

  // Fill in line numbers from the *original* source (first occurrence order).
  for (const rw of rewrites) {
    const idx = source.indexOf(rw.before);
    rw.line = idx === -1 ? 0 : lineOf(source, idx);
  }

  return { output, rewrites };
}

// ---------------------------------------------------------------------------
// Import detection
// ---------------------------------------------------------------------------

/**
 * Best-effort check that `z` is bound to Zod. We accept:
 *   import { z } from "zod";
 *   import { z } from "zod/v4";
 *   import * as z from "zod";
 *   import z from "zod";
 *
 * If `z` is imported from somewhere else, or not imported at all (e.g. via
 * a global), we still process — the rewrite is semantically safe either way.
 * But we *warn* if `z` isn't clearly from zod, so the user can eyeball it.
 */
function looksLikeZodFile(source: string): boolean {
  return /from\s+["']zod(\/v4)?["']/.test(source);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const start = performance.now();

  if (!(await stat(SEARCH_ROOT)).isDirectory()) {
    console.error(`Not a directory: ${SEARCH_ROOT}`);
    process.exit(1);
  }

  const files: string[] = [];
  for await (const entry of glob("**/*.{ts,tsx}", {
    cwd: SEARCH_ROOT,
    exclude: IGNORE_PATTERNS,
  })) {
    files.push(resolve(SEARCH_ROOT, entry));
  }

  if (files.length === 0) {
    console.log("No matching files found.");
    return;
  }

  let changedFiles = 0;
  let totalRewrites = 0;
  const warnings: string[] = [];

  for (const absPath of files) {
    const source = await readFile(absPath, "utf8");

    if (!source.includes(".uuid(")) continue;
    if (!source.includes("z.")) continue;

    if (!looksLikeZodFile(source)) {
      warnings.push(
        `${relative(ROOT, absPath)}: contains .uuid() but no \`from "zod"\` import — skipped`,
      );
      continue;
    }

    const { output, rewrites } = rewrite(source);
    if (rewrites.length === 0) continue;

    changedFiles++;
    totalRewrites += rewrites.length;

    const rel = relative(ROOT, absPath);
    console.log(`\n${rel}`);
    for (const rw of rewrites) {
      // const lineInfo = rw.line ? `:${rw.line}` : "";
      console.log(`  L${rw.line || "?"}  ${rw.before}`);
      console.log(`     → ${rw.after}`);
    }

    if (APPLY) await writeFile(absPath, output, "utf8");
  }

  console.log(
    `\n${APPLY ? "Applied" : "Found"} ${totalRewrites} rewrite(s) across ${changedFiles} file(s) in ${(performance.now() - start).toFixed(0)}ms.`,
  );

  if (!APPLY && totalRewrites > 0) {
    console.log("Re-run with --write to apply.");
  }

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const w of warnings) console.log(`  ! ${w}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
