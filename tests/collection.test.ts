import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { scanRequests, resolveRequest, resolveCollectionRoot } from "../src/collection.js";

describe("Collection Discovery & Resolution", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bruno-mcp-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should scan only valid .bru files, excluding hidden, environments, and node_modules", () => {
    // Set up dummy directory structure
    fs.mkdirSync(path.join(tempDir, "folder1"));
    fs.mkdirSync(path.join(tempDir, "environments"));
    fs.mkdirSync(path.join(tempDir, "node_modules"));
    fs.mkdirSync(path.join(tempDir, ".git"));
    fs.mkdirSync(path.join(tempDir, ".hidden"));

    fs.writeFileSync(path.join(tempDir, "root-request.bru"), "");
    fs.writeFileSync(path.join(tempDir, "folder1/nested.bru"), "");
    fs.writeFileSync(path.join(tempDir, "folder1/not-bru.txt"), "");
    fs.writeFileSync(path.join(tempDir, "environments/local.bru"), "");
    fs.writeFileSync(path.join(tempDir, "node_modules/dep.bru"), "");
    fs.writeFileSync(path.join(tempDir, ".git/git.bru"), "");
    fs.writeFileSync(path.join(tempDir, ".hidden/secret.bru"), "");

    const root = resolveCollectionRoot(tempDir);
    const results = scanRequests(root);

    expect(results).toEqual([
      { name: "folder1/nested", path: "folder1/nested.bru" },
      { name: "root-request", path: "root-request.bru" },
    ]);
  });

  it("should fail validation for absolute request names or path escapes", () => {
    const root = resolveCollectionRoot(tempDir);
    fs.writeFileSync(path.join(tempDir, "request1.bru"), "");

    // Path outside collection
    expect(() => resolveRequest(root, "../outside")).toThrowError(
      expect.objectContaining({ code: "PATH_OUTSIDE_COLLECTION" })
    );

    // Absolute paths are rejected or constrained
    expect(() => resolveRequest(root, "/absolute/path")).toThrowError(
      expect.objectContaining({ code: "PATH_OUTSIDE_COLLECTION" })
    );
  });

  it("should resolve request by exact relative path, without extension, or unique basename", () => {
    const root = resolveCollectionRoot(tempDir);
    fs.mkdirSync(path.join(tempDir, "users"));
    fs.writeFileSync(path.join(tempDir, "users/get-user.bru"), "");

    // 1. By relative path
    expect(resolveRequest(root, "users/get-user.bru")).toBe(path.join(root, "users/get-user.bru"));

    // 2. Without extension
    expect(resolveRequest(root, "users/get-user")).toBe(path.join(root, "users/get-user.bru"));

    // 3. Unique basename
    expect(resolveRequest(root, "get-user")).toBe(path.join(root, "users/get-user.bru"));
  });

  it("should fail with ambiguous request error if basename matches multiple files", () => {
    const root = resolveCollectionRoot(tempDir);
    fs.mkdirSync(path.join(tempDir, "users"));
    fs.mkdirSync(path.join(tempDir, "admins"));
    fs.writeFileSync(path.join(tempDir, "users/get-user.bru"), "");
    fs.writeFileSync(path.join(tempDir, "admins/get-user.bru"), "");

    expect(() => resolveRequest(root, "get-user")).toThrowError(
      expect.objectContaining({
        code: "REQUEST_AMBIGUOUS",
        message: expect.stringContaining("users/get-user.bru"),
      })
    );
  });

  it("should fail with request not found if request does not exist", () => {
    const root = resolveCollectionRoot(tempDir);
    expect(() => resolveRequest(root, "non-existent")).toThrowError(
      expect.objectContaining({ code: "REQUEST_NOT_FOUND" })
    );
  });
});
