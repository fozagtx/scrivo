#!/usr/bin/env node
// Uploads a Next.js static export (out/) to the @convex-dev/static-hosting
// component. Unlike the stock uploader (built for SPAs), this registers
// extensionless aliases for each page HTML file so multi-page routes like
// /deals and /deals/ resolve to deals.html instead of falling back to
// the root index.html.
//
// Usage: node scripts/upload-static.mjs [--dist out] [--prod] [--no-spa]

import { execFile } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : dflt;
};

const distDir = opt("--dist", "out");
const componentName = opt("--component", "staticHosting");
const useProd = flag("--prod");
const spaFallback = !flag("--no-spa");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
};
const getMimeType = (p) => {
  const byExt = MIME_TYPES[extname(p).toLowerCase()];
  if (byExt) return byExt;
  // Next emits metadata routes (opengraph-image, twitter-image) extensionless.
  try {
    const head = readFileSync(p).subarray(0, 4);
    if (head[0] === 0x89 && head[1] === 0x50) return "image/png";
    if (head[0] === 0xff && head[1] === 0xd8) return "image/jpeg";
  } catch {
    /* unreadable */
  }
  return "application/octet-stream";
};

const convexBin = join(
  dirname(new URL(import.meta.url).pathname),
  "..",
  "node_modules",
  "convex",
  "bin",
  "main.js",
);

async function convexRun(fnPath, fnArgs = {}) {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [
      convexBin,
      "run",
      "--component",
      componentName,
      fnPath,
      JSON.stringify(fnArgs),
      "--typecheck=disable",
      "--codegen=disable",
      ...(useProd ? ["--prod"] : []),
    ],
    { encoding: "utf-8", maxBuffer: 32 * 1024 * 1024 },
  );
  if (stderr && stderr.trim()) process.stderr.write(stderr);
  return stdout.trim();
}

function collectFiles(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(full, base));
    else if (entry.isFile())
      files.push({
        path: "/" + relative(base, full).split("\\").join("/"),
        localPath: full,
        contentType: getMimeType(full),
      });
  }
  return files;
}

// Extra manifest rows so MPA routes resolve: deals.html -> /deals and /deals/,
// foo/index.html -> /foo and /foo/.
function htmlAliases(path) {
  const out = [];
  if (path === "/index.html" || path === "/404.html") return out;
  if (path.endsWith("/index.html")) {
    out.push(path.slice(0, -"/index.html".length) || "/");
    out.push(path.slice(0, -"index.html".length)); // trailing slash
  } else if (path.endsWith(".html")) {
    const bare = path.slice(0, -".html".length);
    out.push(bare, bare + "/");
  }
  return out.filter((p) => p !== "/");
}

const files = collectFiles(distDir);
if (!files.some((f) => f.path === "/index.html")) {
  console.error(`Error: ${distDir} has no index.html — run next build first.`);
  process.exit(1);
}

const { siteUrl } = JSON.parse(await convexRun("lib:getUrls"));
console.log(`Site: ${siteUrl}`);
console.log(`Uploading ${files.length} files...`);

const deploymentId = randomUUID();

// One blob per file; aliases reuse the same storageId.
const storageIds = new Array(files.length);
const URL_BATCH = 100;
const uploadUrls = [];
for (let off = 0; off < files.length; off += URL_BATCH) {
  const count = Math.min(URL_BATCH, files.length - off);
  const batch = JSON.parse(await convexRun("lib:generateUploadUrls", { count }));
  uploadUrls.push(...batch);
}
const CONCURRENCY = 8;
let cursor = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < files.length) {
      const idx = cursor++;
      const f = files[idx];
      const res = await fetch(uploadUrls[idx], {
        method: "POST",
        headers: { "Content-Type": f.contentType },
        body: readFileSync(f.localPath),
      });
      if (!res.ok)
        throw new Error(`Upload failed for ${f.path}: ${res.status}`);
      storageIds[idx] = (await res.json()).storageId;
    }
  }),
);

const manifest = [];
for (let i = 0; i < files.length; i++) {
  const f = files[i];
  for (const p of [f.path, ...htmlAliases(f.path)])
    manifest.push({
      path: p,
      storageId: storageIds[i],
      contentType: f.contentType,
      deploymentId,
    });
}

// stageAssets chunks must stay under the CLI arg limit (~20 KiB).
const chunks = [];
let cur = [];
for (const asset of manifest) {
  const candidate = [...cur, asset];
  if (Buffer.byteLength(JSON.stringify({ assets: candidate })) > 20 * 1024) {
    chunks.push(cur);
    cur = [asset];
  } else cur = candidate;
}
if (cur.length) chunks.push(cur);
for (let i = 0; i < chunks.length; i++) {
  await convexRun("lib:stageAssets", { assets: chunks[i] });
  console.log(`  Staged manifest chunk ${i + 1}/${chunks.length}`);
}

const result = JSON.parse(
  await convexRun("lib:publishDeployment", {
    currentDeploymentId: deploymentId,
    expectedAssetCount: manifest.length,
    spaFallback,
  }),
);
console.log(`Published ${manifest.length} asset rows (${result.deleted ?? 0} old deleted).`);
console.log(`Live at ${siteUrl}`);
