import * as fs from "fs";
import * as path from "path";
import { resolveCollectionRoot, scanRequests, resolveRequest } from "./collection.js";
import { parseBruRequest, ParsedBruRequest } from "./parser.js";
import { runBruRequest as execBruRequest, RunBruRequestResult } from "./runner.js";

export interface ListBrunoRequestsResult {
  projectPath: string;
  requests: Array<{
    name: string;
    path: string;
    method?: string;
  }>;
}

export interface GetBrunoRequestDetailResult extends ParsedBruRequest {
  name: string;
  path: string;
}

function getEffectiveRoot(projectPath?: string): string {
  // If not provided, fallback to process.cwd()
  const target = projectPath || process.cwd();
  return resolveCollectionRoot(target);
}

export async function listBrunoRequests(options: {
  projectPath?: string;
}): Promise<ListBrunoRequestsResult> {
  const root = getEffectiveRoot(options.projectPath);
  const requests = scanRequests(root);

  const enrichedRequests = requests.map((req) => {
    let method: string | undefined;
    try {
      const fullPath = path.join(root, ...req.path.split("/"));
      const content = fs.readFileSync(fullPath, "utf8");
      const parsed = parseBruRequest(content);
      method = parsed.method;
    } catch {
      // Ignore parser errors for listing, just omit the method
    }
    return {
      name: req.name,
      path: req.path,
      method,
    };
  });

  return {
    projectPath: root,
    requests: enrichedRequests,
  };
}

export async function getBrunoRequestDetail(options: {
  requestName: string;
  projectPath?: string;
}): Promise<GetBrunoRequestDetailResult> {
  const root = getEffectiveRoot(options.projectPath);
  const absolutePath = resolveRequest(root, options.requestName);
  const relPath = path.relative(root, absolutePath).split(path.sep).join("/");
  const requestName = relPath.replace(/\.bru$/, "");

  const content = fs.readFileSync(absolutePath, "utf8");
  const parsed = parseBruRequest(content);

  return {
    name: requestName,
    path: relPath,
    ...parsed,
  };
}

export async function runBrunoRequest(options: {
  requestName: string;
  projectPath?: string;
  env?: string;
  envVars?: Record<string, string>;
}): Promise<RunBruRequestResult> {
  const root = getEffectiveRoot(options.projectPath);
  const absolutePath = resolveRequest(root, options.requestName);
  const relPath = path.relative(root, absolutePath).split(path.sep).join("/");

  return execBruRequest({
    collectionRoot: root,
    requestPath: relPath,
    env: options.env,
    envVars: options.envVars,
  });
}
