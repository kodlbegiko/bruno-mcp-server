# Bruno MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a tested TypeScript MCP stdio server that discovers, inspects, and executes local Bruno requests through the official Bruno CLI.

**Architecture:** Focused collection, parser, runner, and MCP adapter modules communicate through typed values. Filesystem access is constrained to a canonical collection root, while request execution spawns the pinned project-local Bruno CLI without a shell.

**Tech Stack:** Node.js 20+, TypeScript, npm, `@modelcontextprotocol/sdk` v1, Zod, `@usebruno/cli`, Vitest, ESLint.

---

## File structure

- `src/errors.ts`: stable domain error codes and safe messages.
- `src/collection.ts`: collection-root validation, scanning, containment, and request resolution.
- `src/parser.ts`: tolerant extraction of common request metadata from `.bru` source.
- `src/runner.ts`: Bruno CLI argument construction, process lifecycle, timeout, and output limits.
- `src/tools.ts`: framework-neutral implementations of the three public tools.
- `src/server.ts`: MCP schemas, tool registration, and stdio startup.
- `src/index.ts`: executable entry point.
- `tests/*.test.ts`: isolated unit and tool-level integration tests using temporary fixtures.
- `fixtures/demo/`: runnable example Bruno collection.
- `README.md`, `CONTRIBUTING.md`, `LICENSE`: adoption and contribution documentation.

### Task 1: Project foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `.gitignore`

- [ ] **Step 1: Create package metadata and scripts**

Define ESM package metadata, Node 20 engine, `bruno-mcp-server` bin, and scripts for `build`, `typecheck`, `lint`, `test`, and `check`. Pin MCP SDK v1 and Bruno CLI runtime dependencies; add TypeScript, ESLint, and Vitest development dependencies.

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: exit 0 and a generated `package-lock.json`.

- [ ] **Step 3: Add strict compiler and lint configuration**

Compile `src` to `dist` with NodeNext module resolution, declarations, source maps, strict checks, and executable-compatible output.

- [ ] **Step 4: Verify the empty foundation**

Run: `npm run typecheck && npm run lint`
Expected: exit 0.

- [ ] **Step 5: Commit**

Run: `git add package.json package-lock.json tsconfig.json eslint.config.js .gitignore && git commit -m "chore: initialize TypeScript MCP project"`

### Task 2: Safe collection discovery and resolution

**Files:**
- Create: `src/errors.ts`
- Create: `src/collection.ts`
- Create: `tests/collection.test.ts`

- [ ] **Step 1: Write failing discovery tests**

Tests create temporary collections and assert that `scanRequests(root)` returns sorted `.bru` paths while excluding `.git`, hidden folders, `node_modules`, and `environments`.

- [ ] **Step 2: Run tests and confirm RED**

Run: `npm test -- tests/collection.test.ts`
Expected: FAIL because `src/collection.ts` does not exist.

- [ ] **Step 3: Implement discovery minimally**

Export `resolveCollectionRoot`, `scanRequests`, and `RequestSummary`. Canonicalize roots with `realpath`, walk with `readdir({ withFileTypes: true })`, and return slash-separated relative paths.

- [ ] **Step 4: Run tests and confirm GREEN**

Run: `npm test -- tests/collection.test.ts`
Expected: all discovery tests pass.

- [ ] **Step 5: Write failing resolution and containment tests**

Assert relative path, extensionless path, and unique basename resolution; assert stable `REQUEST_AMBIGUOUS`, `REQUEST_NOT_FOUND`, and `PATH_OUTSIDE_COLLECTION` errors, including a symlink escape fixture.

- [ ] **Step 6: Implement request resolution and domain errors**

Add `BrunoMcpError` with stable codes and implement `resolveRequest(root, requestName)` using canonical candidate paths and explicit ambiguity handling.

- [ ] **Step 7: Verify and commit**

Run: `npm test -- tests/collection.test.ts`
Expected: all collection tests pass.

Run: `git add src/errors.ts src/collection.ts tests/collection.test.ts && git commit -m "feat: discover Bruno requests safely"`

### Task 3: Bruno request detail parser

**Files:**
- Create: `src/parser.ts`
- Create: `tests/parser.test.ts`

- [ ] **Step 1: Write failing parser tests**

Cover `meta`, HTTP request blocks, `headers`, `body:json`, and `auth:bearer`. Assert comments and disabled header lines are ignored and `rawContent` is preserved exactly.

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/parser.test.ts`
Expected: FAIL because `parseBruRequest` is unavailable.

- [ ] **Step 3: Implement the tolerant parser**

Export `ParsedBruRequest` and `parseBruRequest(source)`. Parse named brace blocks line-by-line, recognize HTTP method blocks, convert header entries to records, keep body text verbatim, and return unknown auth fields as a record.

- [ ] **Step 4: Confirm GREEN and commit**

Run: `npm test -- tests/parser.test.ts`
Expected: all parser tests pass.

Run: `git add src/parser.ts tests/parser.test.ts && git commit -m "feat: parse Bruno request details"`

### Task 4: Bruno CLI runner

**Files:**
- Create: `src/runner.ts`
- Create: `tests/runner.test.ts`
- Create: `tests/fixtures/fake-bru.mjs`

- [ ] **Step 1: Write failing argument tests**

Assert `buildBruArguments` produces `run <relative-file>`, optional `--env <name>`, and sorted repeated `--env-var KEY=VALUE` arguments without a Developer Mode flag.

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/runner.test.ts`
Expected: FAIL because runner exports do not exist.

- [ ] **Step 3: Implement argument construction**

Validate environment names and variable keys for NUL/newline characters, then return an argument array suitable for `spawn` with `shell: false`.

- [ ] **Step 4: Write failing lifecycle tests**

Use the fake executable to assert exit-code capture, stdout/stderr collection, timeout termination, and explicit truncation at a small injected byte limit.

- [ ] **Step 5: Implement process lifecycle**

Export `runBruRequest(options, dependencies?)`. Resolve the local CLI bin from `@usebruno/cli`, spawn it in the collection root, cap each output stream, terminate on timeout, and never interpolate a shell command.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- tests/runner.test.ts`
Expected: all runner tests pass with no leaked child processes.

Run: `git add src/runner.ts tests/runner.test.ts tests/fixtures/fake-bru.mjs && git commit -m "feat: execute requests with Bruno CLI"`

### Task 5: Tool implementations and MCP server

**Files:**
- Create: `src/tools.ts`
- Create: `src/server.ts`
- Create: `src/index.ts`
- Create: `tests/tools.test.ts`

- [ ] **Step 1: Write failing tool tests**

Build a temporary collection and assert list returns stable summaries, detail returns structured metadata and raw content, and run delegates the resolved request plus environment arguments to an injected runner.

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/tools.test.ts`
Expected: FAIL because tool implementations are unavailable.

- [ ] **Step 3: Implement framework-neutral tools**

Export `listBrunoRequests`, `getBrunoRequestDetail`, and `runBrunoRequest`. Resolve the effective root, compose the collection/parser/runner modules, and return JSON-serializable objects.

- [ ] **Step 4: Confirm GREEN**

Run: `npm test -- tests/tools.test.ts`
Expected: all tool tests pass.

- [ ] **Step 5: Register MCP tools and executable startup**

Create Zod input schemas, convert success values to pretty JSON text content, convert `BrunoMcpError` to `isError` responses, and connect `McpServer` to `StdioServerTransport`. Read `--project-path` without writing protocol noise to stdout.

- [ ] **Step 6: Build and run full checks**

Run: `npm run check`
Expected: typecheck, lint, tests, and build all exit 0.

- [ ] **Step 7: Commit**

Run: `git add src tests/tools.test.ts && git commit -m "feat: expose Bruno MCP tools"`

### Task 6: Open-source documentation and demo

**Files:**
- Create: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `LICENSE`
- Create: `fixtures/demo/bruno.json`
- Create: `fixtures/demo/ping.bru`

- [ ] **Step 1: Add a valid demo fixture**

Create a minimal Bruno collection and a GET request against `https://httpbin.org/get` so users can inspect and optionally execute the server locally.

- [ ] **Step 2: Write adoption documentation**

Document the local-first value proposition, Node requirement, `npx` and source installation, Cursor/Claude-style stdio configuration, all tool inputs/outputs, Safe Mode, path containment, 60-second timeout, output limits, roadmap, and demo commands.

- [ ] **Step 3: Add contribution and license files**

Use the MIT license and explain setup, test commands, pull-request expectations, and security-reporting guidance.

- [ ] **Step 4: Validate documented commands**

Run: `npm run check && node dist/index.js --help`
Expected: checks exit 0 and help text lists `--project-path`.

- [ ] **Step 5: Commit**

Run: `git add README.md CONTRIBUTING.md LICENSE fixtures && git commit -m "docs: add quickstart and demo collection"`

### Task 7: Publish to GitHub

**Files:**
- Modify: repository metadata only.

- [ ] **Step 1: Perform fresh verification**

Run: `npm ci && npm run check && git status --short`
Expected: installation and all checks pass; no uncommitted product changes remain.

- [ ] **Step 2: Create the public repository**

Run: `gh repo create bruno-mcp-server --public --source=. --remote=origin --description "Local-first MCP server for discovering, inspecting, and running Bruno API requests"`
Expected: GitHub creates `kodlbegiko/bruno-mcp-server` and adds `origin`.

- [ ] **Step 3: Create publication branch and push**

Run: `git checkout -b codex/bruno-mcp-server-mvp && git push -u origin codex/bruno-mcp-server-mvp`
Expected: the branch is visible on GitHub with upstream tracking.

- [ ] **Step 4: Open a draft pull request**

Run: `GH_PROMPT_DISABLED=1 GIT_TERMINAL_PROMPT=0 gh pr create --draft --fill --base main --head codex/bruno-mcp-server-mvp`
Expected: GitHub returns a pull-request URL describing the MVP and verification evidence.
