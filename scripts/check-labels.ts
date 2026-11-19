import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { labelFilePath, readLabelFile } from "./labels.ts";

// ─── Policy: what to scan ───────────────────────────────────────────────────

const scanned: { directory: string; keeps: RegExp }[] = [
  { directory: ".github/workflows", keeps: /\.ya?ml$/ },
  { directory: "scripts", keeps: /\.(ts|mts|mjs|sh)$/ },
  { directory: "docs/agents", keeps: /\.md$/ },
];

const testFilePattern = /\.test\.(ts|mts)$/;

const shouldScan = (relativePath: string) =>
  !relativePath.split(path.sep).includes("node_modules") &&
  scanned.some(({ keeps }) => keeps.test(relativePath)) &&
  !testFilePattern.test(relativePath);

// ─── Grammar: what a label looks like and where it is named ─────────────────

const labelValue = String.raw`[A-Za-z0-9](?:[\w:,-]*[A-Za-z0-9])?(?![\w:<*,-])`;

const referencePatterns: RegExp[] = [
  new RegExp(String.raw`--(?:add-|remove-)?label["']?(?:\s*,\s*|=|\s+)["']?(${labelValue})`, "dg"),
  new RegExp(String.raw`label\.name\s*===?\s*["'](${labelValue})["']`, "dg"),
  new RegExp(String.raw`(?:^|[\s(\0])\.\s*==\s*"(${labelValue})"`, "dg"),
  new RegExp(String.raw`\b((?:priority|wayfinder):${labelValue})`, "dg"),
];

type LabelReference = {
  filePath: string;
  label: string;
  lineNumber: number;
};

/** One label per comma-separated segment, each pinned to its own offset. */
function labelsInMatch(whole: string, start: number): { label: string; offset: number }[] {
  const out: { label: string; offset: number }[] = [];
  let cursor = start;
  for (const label of whole.split(",")) {
    if (label) out.push({ label, offset: cursor });
    cursor += label.length + 1;
  }
  return out;
}

function referencesIn(searched: string, filePath: string): LabelReference[] {
  const byOffset = new Map<number, string>();

  for (const pattern of referencePatterns) {
    for (const match of searched.matchAll(pattern)) {
      const start = match.indices?.[1]?.[0];
      if (start === undefined) continue;
      for (const { label, offset } of labelsInMatch(match[1] ?? "", start)) {
        byOffset.set(offset, label);
      }
    }
  }

  return [...byOffset]
    .sort(([a], [b]) => a - b)
    .map(([offset, label]) => ({
      filePath,
      label,
      lineNumber: searched.slice(0, offset).split("\n").length,
    }));
}

// ─── Markdown: keep code, blank prose ───────────────────────────────────────

const blank = (length: number) => "\0".repeat(length);

function keepOnlyMarkdownCode(contents: string): string {
  let insideFence = false;

  return contents
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        insideFence = !insideFence;
        return blank(line.length);
      }
      if (insideFence) return line;

      let kept = "";
      let index = 0;
      while (index < line.length) {
        const open = line.indexOf("`", index);
        const close = open === -1 ? -1 : line.indexOf("`", open + 1);
        if (close === -1) return kept + blank(line.length - index);
        kept += `${blank(open - index + 1)}${line.slice(open + 1, close)}${blank(1)}`;
        index = close + 1;
      }
      return kept;
    })
    .join("\n");
}

// ─── Public: find references in one file ────────────────────────────────────

export function findLabelReferencesInSource(input: {
  contents: string;
  filePath: string;
}): LabelReference[] {
  const searched = input.filePath.endsWith(".md")
    ? keepOnlyMarkdownCode(input.contents)
    : input.contents;
  return referencesIn(searched, input.filePath);
}

// ─── Reading: directory traversal, with policy applied ──────────────────────

function readScannedFiles(rootDirectory: string): { contents: string; filePath: string }[] {
  return scanned.flatMap(({ directory }) => {
    const entries = readdirSync(path.join(rootDirectory, directory), { recursive: true })
      .map(String)
      .filter(shouldScan);

    return entries.map((relativePath) => ({
      contents: readFileSync(path.join(rootDirectory, directory, relativePath), "utf8"),
      filePath: path.join(directory, relativePath),
    }));
  });
}

// ─── Public: the check ──────────────────────────────────────────────────────

export function checkLabels(
  options: {
    files?: { contents: string; filePath: string }[];
    known?: string[];
    rootDirectory?: string;
  } = {},
): LabelReference[] {
  const rootDirectory = options.rootDirectory ?? process.cwd();
  const known = new Set(options.known ?? readLabelFile(rootDirectory).map((label) => label.name));
  const files = options.files ?? readScannedFiles(rootDirectory);

  return files
    .flatMap(findLabelReferencesInSource)
    .filter((reference) => !known.has(reference.label));
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function formatViolations(violations: LabelReference[]): string {
  return [
    `Labels referenced but not in ${labelFilePath}:`,
    ...violations.map((v) => `- ${v.filePath}:${v.lineNumber} ${v.label}`),
    "",
    `Fix the spelling, or add the label to ${labelFilePath} and run \`bun run labels:sync\`.`,
  ].join("\n");
}

function runLabelsCheck(): void {
  const violations = checkLabels();
  if (violations.length > 0) throw new Error(formatViolations(violations));
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  try {
    runLabelsCheck();
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
