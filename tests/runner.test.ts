import { describe, it, expect } from "vitest";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { buildBruArguments, runBruRequest } from "../src/runner.js";

describe("Bruno CLI runner - Argument Construction", () => {
  it("should build correct arguments with env and variables", () => {
    const args = buildBruArguments("folder/req.bru", {
      env: "local",
      envVars: {
        VAR_B: "val2",
        VAR_A: "val1",
      },
    });

    expect(args).toEqual([
      "run",
      "folder/req.bru",
      "--env",
      "local",
      "--env-var",
      "VAR_A=val1",
      "--env-var",
      "VAR_B=val2",
    ]);
  });

  it("should fail validation if env name or var key contains invalid characters", () => {
    expect(() => buildBruArguments("req.bru", { env: "bad\nname" })).toThrow();
    expect(() => buildBruArguments("req.bru", { envVars: { "bad\0key": "val" } })).toThrow();
  });
});

describe("Bruno CLI runner - Process Lifecycle", () => {
  const fakeCliPath = path.resolve("tests/fixtures/fake-bru.mjs");

  it("should execute and capture exit code and outputs", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bruno-runner-test-"));
    
    // We override process path to point to node + our fake CLI in the run options
    const result = await runBruRequest(
      {
        collectionRoot: tempDir,
        requestPath: "ping.bru",
      },
      {
        cliPath: fakeCliPath,
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Fake CLI stdout");
    expect(result.stderr).toContain("Fake CLI stderr");
    expect(result.timedOut).toBe(false);
    expect(result.truncated).toBe(false);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should truncate output if it exceeds size limits", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bruno-runner-test-"));
    const result = await runBruRequest(
      {
        collectionRoot: tempDir,
        requestPath: "ping.bru",
        maxOutputBytes: 10, // tiny limit for test
      },
      {
        cliPath: fakeCliPath,
      }
    );

    expect(result.stdout.length).toBeLessThanOrEqual(10 + 30); // 10 bytes limit + suffix length
    expect(result.truncated).toBe(true);
    expect(result.stdout).toContain("...");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
