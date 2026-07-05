#!/usr/bin/env node
import process from "process";

// Simple mock for Bruno CLI
process.stdout.write("Fake CLI stdout: Running request...\n");
process.stderr.write("Fake CLI stderr: Loading environment...\n");

if (process.argv.includes("--env-var")) {
  process.stdout.write(`Received env vars: ${process.argv.slice(2).join(" ")}\n`);
}

process.exit(0);
