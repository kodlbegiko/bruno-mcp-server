export interface ParsedBruRequest {
  method?: string;
  url?: string;
  headers: Record<string, string>;
  body: {
    type: string;
    content: string;
  };
  auth: {
    type: string;
    bearer?: Record<string, string>;
    basic?: Record<string, string>;
    apikey?: Record<string, string>;
    awsv4?: Record<string, string>;
    [key: string]: any;
  };
  rawContent: string;
}

interface Block {
  name: string;
  content: string;
}

function extractBlocks(source: string): Block[] {
  const lines = source.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(/^(\s*)([a-zA-Z0-9_:-]+)\s*\{/);
    if (match) {
      const indent = match[1];
      const name = match[2];
      const blockLines: string[] = [];
      i++;

      const closerRegex = new RegExp(`^${indent}}$`);
      while (i < lines.length) {
        const blockLine = lines[i];
        if (closerRegex.test(blockLine.trimEnd())) {
          break;
        }
        blockLines.push(blockLine);
        i++;
      }

      let content = blockLines.join("\n");

      // Strip common relative indentation of the block content lines
      const nonBlankLines = blockLines.filter((l) => l.trim().length > 0);
      if (nonBlankLines.length > 0) {
        const minIndent = nonBlankLines.reduce((min, l) => {
          const m = l.match(/^(\s*)/);
          const len = m ? m[1].length : 0;
          return len < min ? len : min;
        }, Infinity);

        if (minIndent !== Infinity && minIndent > 0) {
          content = blockLines
            .map((l) => (l.length >= minIndent ? l.substring(minIndent) : l.trim()))
            .join("\n");
        }
      }

      blocks.push({ name, content });
    }
    i++;
  }
  return blocks;
}

function parseKv(content: string, ignoreComments = false): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (ignoreComments) {
      if (
        trimmed.startsWith("~") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("//")
      ) {
        continue;
      }
    }

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex !== -1) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      result[key] = value;
    }
  }
  return result;
}

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
  "options",
  "http",
]);

export function parseBruRequest(source: string): ParsedBruRequest {
  const blocks = extractBlocks(source);

  let method: string | undefined;
  let url: string | undefined;
  let bodyType = "none";
  let authType = "none";
  const headers: Record<string, string> = {};
  let bodyContent = "";
  const authDetails: Record<string, any> = {};

  for (const block of blocks) {
    const nameLower = block.name.toLowerCase();

    // 1. HTTP method block (e.g. get {, post {)
    if (HTTP_METHODS.has(nameLower)) {
      method = nameLower;
      const kv = parseKv(block.content);
      if (kv.url) url = kv.url;
      if (kv.body) bodyType = kv.body.toLowerCase();
      if (kv.auth) authType = kv.auth.toLowerCase();
    }

    // 2. Headers block
    if (nameLower === "headers") {
      Object.assign(headers, parseKv(block.content, true));
    }

    // 3. Auth blocks (e.g. auth:bearer)
    if (nameLower.startsWith("auth:")) {
      const subType = block.name.substring(5); // e.g. "bearer"
      authDetails[subType] = parseKv(block.content);
    }

    // 4. Body blocks (e.g. body:json)
    if (nameLower.startsWith("body:")) {
      bodyContent = block.content;
    }
  }

  return {
    method,
    url,
    headers,
    body: {
      type: bodyType,
      content: bodyContent,
    },
    auth: {
      type: authType,
      ...authDetails,
    },
    rawContent: source,
  };
}
