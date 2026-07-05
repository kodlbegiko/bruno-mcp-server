import * as fs from "fs";
import * as path from "path";
import { BrunoMcpError } from "./errors.js";

export interface RequestSummary {
  name: string; // slash-separated relative path without extension
  path: string; // relative path
}

export function resolveCollectionRoot(rootPath: string): string {
  try {
    const resolved = fs.realpathSync(rootPath);
    const stats = fs.statSync(resolved);
    if (!stats.isDirectory()) {
      throw new BrunoMcpError(
        "INVALID_COLLECTION",
        `Collection root is not a directory: ${rootPath}`
      );
    }
    return resolved;
  } catch (err: any) {
    if (err instanceof BrunoMcpError) throw err;
    throw new BrunoMcpError(
      "INVALID_COLLECTION",
      `Failed to resolve collection root "${rootPath}": ${err.message}`
    );
  }
}

export function scanRequests(root: string): RequestSummary[] {
  const canonicalRoot = resolveCollectionRoot(root);
  const files: string[] = [];

  function traverse(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      
      // Basic exclusions
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "environments") {
        continue;
      }

      if (entry.isDirectory()) {
        traverse(entryPath);
      } else if (entry.isFile() && entry.name.endsWith(".bru")) {
        files.push(entryPath);
      }
    }
  }

  traverse(canonicalRoot);

  return files
    .map((file) => {
      const relPath = path.relative(canonicalRoot, file);
      // Normalize to forward slashes for request name
      const normalizedName = relPath.replace(/\.bru$/, "").split(path.sep).join("/");
      const normalizedPath = relPath.split(path.sep).join("/");
      return {
        name: normalizedName,
        path: normalizedPath,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveRequest(root: string, requestName: string): string {
  const canonicalRoot = resolveCollectionRoot(root);
  const requests = scanRequests(canonicalRoot);

  // Normalize inputs
  const target = requestName.trim().split(/[\\/]/).join("/");

  // 1. Exact match (with or without .bru)
  const exactMatch = requests.find(
    (r) => r.path === target || r.name === target || r.path === `${target}.bru`
  );
  if (exactMatch) {
    const resolvedPath = path.join(canonicalRoot, ...exactMatch.path.split("/"));
    return verifyPathInCollection(canonicalRoot, resolvedPath);
  }

  // 2. Basename matching
  const targetBasename = path.basename(target, ".bru");
  const candidates = requests.filter((r) => {
    const base = path.basename(r.path, ".bru");
    return base === targetBasename;
  });

  if (candidates.length === 1) {
    const resolvedPath = path.join(canonicalRoot, ...candidates[0].path.split("/"));
    return verifyPathInCollection(canonicalRoot, resolvedPath);
  }

  if (candidates.length > 1) {
    const list = candidates.map((c) => c.path).join(", ");
    throw new BrunoMcpError(
      "REQUEST_AMBIGUOUS",
      `Request name "${requestName}" is ambiguous. Candidates: ${list}`
    );
  }

  // 3. Fallback check for relative path escapes before raising not found
  // E.g. requestName is "../outside" or absolute path
  let absoluteCandidate: string;
  if (path.isAbsolute(requestName)) {
    absoluteCandidate = path.normalize(requestName);
  } else {
    absoluteCandidate = path.normalize(path.join(canonicalRoot, requestName));
  }

  // Verify containment
  verifyPathInCollection(canonicalRoot, absoluteCandidate);

  // If inside but not found in scanner
  throw new BrunoMcpError(
    "REQUEST_NOT_FOUND",
    `Request "${requestName}" not found in collection.`
  );
}

function verifyPathInCollection(root: string, targetPath: string): string {
  let canonicalTarget: string;
  try {
    // If file exists, realpathSync it; otherwise realpath the parent dir to resolve symlinks
    if (fs.existsSync(targetPath)) {
      canonicalTarget = fs.realpathSync(targetPath);
    } else {
      const parent = path.dirname(targetPath);
      canonicalTarget = path.join(fs.realpathSync(parent), path.basename(targetPath));
    }
  } catch (err: any) {
    throw new BrunoMcpError(
      "PATH_OUTSIDE_COLLECTION",
      `Invalid path structure: ${err.message}`
    );
  }

  // Ensure root prefix matches. We add a trailing separator to prevent matching `/a/b-outside` with `/a/b`.
  const rootWithTrailing = root.endsWith(path.sep) ? root : root + path.sep;
  if (!canonicalTarget.startsWith(rootWithTrailing)) {
    throw new BrunoMcpError(
      "PATH_OUTSIDE_COLLECTION",
      `Access denied: Target path "${canonicalTarget}" is outside the collection root "${root}".`
    );
  }

  return canonicalTarget;
}
