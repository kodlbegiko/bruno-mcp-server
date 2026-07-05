import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { listBrunoRequests, getBrunoRequestDetail, runBrunoRequest } from "../src/tools.js";
import * as runner from "../src/runner.js";

describe("Framework-neutral tools", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bruno-tools-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("should list requests with their HTTP methods", async () => {
    fs.mkdirSync(path.join(tempDir, "users"));
    fs.writeFileSync(
      path.join(tempDir, "users/get-user.bru"),
      `meta {
  name: Get User
  type: http
}
get {
  url: http://localhost/user
}
`
    );

    const result = await listBrunoRequests({ projectPath: tempDir });
    expect(result.projectPath).toBe(fs.realpathSync(tempDir));
    expect(result.requests).toEqual([
      {
        name: "users/get-user",
        path: "users/get-user.bru",
        method: "get",
      },
    ]);
  });

  it("should get request details", async () => {
    const rawContent = `meta {
  name: Get User
}
get {
  url: http://localhost/user
}
`;
    fs.writeFileSync(path.join(tempDir, "get-user.bru"), rawContent);

    const detail = await getBrunoRequestDetail({
      requestName: "get-user",
      projectPath: tempDir,
    });

    expect(detail.name).toBe("get-user");
    expect(detail.method).toBe("get");
    expect(detail.url).toBe("http://localhost/user");
    expect(detail.rawContent).toBe(rawContent);
  });

  it("should execute a request by delegating to the runner", async () => {
    fs.writeFileSync(
      path.join(tempDir, "ping.bru"),
      `get { url: http://localhost }`
    );

    const runMock = vi.spyOn(runner, "runBruRequest").mockResolvedValue({
      requestName: "ping",
      exitCode: 0,
      timedOut: false,
      stdout: "mocked stdout",
      stderr: "mocked stderr",
      truncated: false,
    });

    const result = await runBrunoRequest({
      requestName: "ping",
      projectPath: tempDir,
      env: "local",
      envVars: { VAR_A: "val" },
    });

    expect(runMock).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionRoot: fs.realpathSync(tempDir),
        requestPath: "ping.bru",
        env: "local",
        envVars: { VAR_A: "val" },
      })
    );
    expect(result.stdout).toBe("mocked stdout");
  });
});
