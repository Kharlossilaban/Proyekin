// Loader Node untuk pemeriksaan terarah: memuat modul `.ts` proyek dengan alias `@/` → `src/`.
// Memakai `typescript` (devDependency yang sudah ada) untuk transpile; tidak ada dependency baru.
// Hanya untuk skrip pemeriksaan (scripts/check-*.mjs), bukan bagian aplikasi.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), "../../src");
const CANDIDATES = (base) => [`${base}.ts`, join(base, "index.ts")];

export async function resolve(specifier, context, nextResolve) {
  let base = null;
  if (specifier.startsWith("@/")) base = join(SRC, specifier.slice(2));
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:") && !extname(specifier)) {
    base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (base) {
    const found = CANDIDATES(base).find((candidate) => existsSync(candidate));
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:") || !url.endsWith(".ts")) return nextLoad(url, context);
  const fileName = fileURLToPath(url);
  const source = await readFile(fileName, "utf8");
  const out = ts.transpileModule(source, {
    fileName,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: out.outputText, shortCircuit: true };
}
