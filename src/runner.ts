import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { BrunoMcpError } from "./errors.js";

export interface RunBruRequestOptions {
  collectionRoot: string;
  requestPath: string;
  env?: string;
  envVars?: Record<string, string>;
  maxOutputBytes?: number;
  timeoutMs?: number;
}

export interface RunBruRequestDependencies {
  cliPath?: string;
}

export interface RunBruRequestResult {
  requestName: string;
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  truncated: boolean;
}

export function buildBruArguments(
  requestPath: string,
  options: { env?: string; envVars?: Record<string, string> }
): string[] {
  // Validate env name for NUL or newlines
  if (options.env) {
    if (options.env.includes("\0") || options.env.includes("\n") || options.env.includes("\r")) {
      throw new BrunoMcpError(
        "INVALID_INPUT",
        "Environment name contains invalid characters."
      );
    }
  }

  // Validate envVars keys and values
  if (options.envVars) {
    for (const [key, value] of Object.entries(options.envVars)) {
      if (
        key.includes("\0") ||
        key.includes("\n") ||
        key.includes("\r") ||
        value.includes("\0") ||
        value.includes("\n") ||
        value.includes("\r")
      ) {
        throw new BrunoMcpError(
          "INVALID_INPUT",
          "Environment variable key or value contains invalid characters."
        );
      }
    }
  }

  const args: string[] = ["run", requestPath];

  if (options.env) {
    args.push("--env", options.env);
  }

  if (options.envVars) {
    // Sort keys stably
    const sortedKeys = Object.keys(options.envVars).sort();
    for (const key of sortedKeys) {
      args.push("--env-var", `${key}=${options.envVars[key]}`);
    }
  }

  return args;
}

export function runBruRequest(
  options: RunBruRequestOptions,
  dependencies: RunBruRequestDependencies = {}
): Promise<RunBruRequestResult> {
  return new Promise((resolve) => {
    const requestName = options.requestPath.replace(/\.bru$/, "");
    const timeoutMs = options.timeoutMs ?? 60000;
    const maxBytes = options.maxOutputBytes ?? 102 * 1024; // 100KB default

    // Resolve CLI binary path
    let cliBin = dependencies.cliPath;
    if (!cliBin) {
      // Look for project-local cli.js/bru.js
      const localPaths = [
        path.join(options.collectionRoot, "node_modules/@usebruno/cli/bin/bru.js"),
        path.join(process.cwd(), "node_modules/@usebruno/cli/bin/bru.js"),
      ];
      for (const p of localPaths) {
        if (fs.existsSync(p)) {
          cliBin = p;
          break;
        }
      }
    }

    if (!cliBin || !fs.existsSync(cliBin)) {
      throw new BrunoMcpError(
        "CLI_UNAVAILABLE",
        "Bruno CLI binary could not be found. Please ensure @usebruno/cli is installed."
      );
    }

    const args = [cliBin, ...buildBruArguments(options.requestPath, {
      env: options.env,
      envVars: options.envVars,
    })];

    // Spawn node with our CLI script, ensuring shell: false
    const child = spawn(process.execPath, args, {
      cwd: options.collectionRoot,
      shell: false,
      env: { ...process.env }, // Pass existing environment variables safely
    });

    let stdoutBuffer = Buffer.alloc(0);
    let stderrBuffer = Buffer.alloc(0);
    let truncated = false;
    let timedOut = false;

    // Timeout handling
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      if (truncated) return;
      if (stdoutBuffer.length + chunk.length > maxBytes) {
        const allowed = maxBytes - stdoutBuffer.length;
        if (allowed > 0) {
          stdoutBuffer = Buffer.concat([stdoutBuffer, chunk.subarray(0, allowed)]);
        }
        truncated = true;
        child.kill("SIGKILL");
      } else {
        stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      if (truncated) return;
      if (stderrBuffer.length + chunk.length > maxBytes) {
        const allowed = maxBytes - stderrBuffer.length;
        if (allowed > 0) {
          stderrBuffer = Buffer.concat([stderrBuffer, chunk.subarray(0, allowed)]);
        }
        truncated = true;
        child.kill("SIGKILL");
      } else {
        stderrBuffer = Buffer.concat([stderrBuffer, chunk]);
      }
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);

      let stdoutText = stdoutBuffer.toString("utf8");
      let stderrText = stderrBuffer.toString("utf8");

      if (truncated) {
        stdoutText += "\n... [Output Truncated] ...";
        stderrText += "\n... [Output Truncated] ...";
      }

      resolve({
        requestName,
        exitCode: timedOut ? null : exitCode,
        timedOut,
        stdout: stdoutText,
        stderr: stderrText,
        truncated,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        requestName,
        exitCode: null,
        timedOut,
        stdout: stdoutBuffer.toString("utf8"),
        stderr: stderrBuffer.toString("utf8") + `\nProcess error: ${err.message}`,
        truncated,
      });
    });
  });
}
