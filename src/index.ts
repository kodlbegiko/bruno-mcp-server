#!/usr/bin/env node
import { runServer } from "./server.js";

function printHelp() {
  console.error("Bruno MCP Server - Local-first API Testing Adapter\n");
  console.error("Usage: node dist/index.js [options]\n");
  console.error("Options:");
  console.error("  --project-path <path>  Default Bruno collection root path.");
  console.error("  --help, -h             Show help information.\n");
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  let defaultProjectPath: string | undefined;
  const projectPathArgIndex = process.argv.indexOf("--project-path");
  if (projectPathArgIndex !== -1 && projectPathArgIndex + 1 < process.argv.length) {
    defaultProjectPath = process.argv[projectPathArgIndex + 1];
  }

  try {
    await runServer(defaultProjectPath);
  } catch (err: any) {
    console.error(`Fatal error starting server: ${err.message}`);
    process.exit(1);
  }
}

main();
