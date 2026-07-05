# Bruno MCP Server MVP Design

## Goal

Build a public, local-first MCP server that lets AI coding agents discover, inspect, and execute requests in a Bruno collection without switching applications or uploading credentials to a hosted service.

## Scope

The MVP exposes three tools over MCP stdio:

1. `list_bruno_requests` discovers request files beneath a Bruno collection root.
2. `get_bruno_request_detail` returns structured request metadata plus the source `.bru` content.
3. `run_bruno_request` executes one request through the official Bruno CLI and returns its result.

Generating requests, chained authentication, HTTP transport, CI integrations, and Developer Mode are deferred.

## Runtime and dependencies

- Node.js 20 or newer and TypeScript using ECMAScript modules.
- The stable v1 `@modelcontextprotocol/sdk` line with `StdioServerTransport`.
- Zod for MCP input validation.
- `@usebruno/cli` as a pinned runtime dependency. The server invokes the project-local CLI rather than requiring a global installation.
- npm for package management and distribution.

The executable accepts an optional collection root argument. Tool calls may supply `project_path`; otherwise the configured root or current working directory is used.

## Components

### Collection discovery

The scanner validates the collection root, recursively finds `.bru` files, and excludes hidden directories, `node_modules`, and environment directories. Results include a stable slash-separated request name, relative path, and HTTP method when it can be read cheaply.

All resolved paths must remain beneath the selected collection root after canonicalization. Symbolic-link escapes and absolute request names are rejected.

### Request resolution

A request can be addressed by its relative path, its path without the `.bru` extension, or a unique file basename. An ambiguous basename fails with a list of candidate paths instead of selecting one arbitrarily.

### Request parsing

The detail parser extracts the common Bruno blocks for request metadata: method, URL, headers, body, and authentication. It also returns the complete source as `rawContent`, preserving information that the MVP parser does not yet structure. Unsupported or malformed blocks produce partial structured output rather than silently changing the source.

### Bruno execution

The runner spawns the pinned local `bru` binary with an argument array, never through a shell. It runs the resolved request from the collection root and supports a named `env` plus repeated `env_vars` overrides. Safe Mode remains enabled; the MCP surface does not expose `--sandbox=developer`.

Execution has a 60-second default timeout. The server captures exit code, standard output, and standard error, truncating oversized output with an explicit marker. Environment variable values are passed directly to the child process arguments and are never included in diagnostic messages returned by the server.

## Tool contracts

### `list_bruno_requests`

Input:

- `project_path?: string`

Output:

- `projectPath: string`
- `requests: Array<{ name: string; path: string; method?: string }>`

### `get_bruno_request_detail`

Input:

- `request_name: string`
- `project_path?: string`

Output:

- `name`, `path`, `method`, `url`
- `headers`, `body`, `auth`
- `rawContent`

### `run_bruno_request`

Input:

- `request_name: string`
- `project_path?: string`
- `env?: string`
- `env_vars?: Record<string, string>`

Output:

- `requestName`, `exitCode`, `timedOut`
- `stdout`, `stderr`, `truncated`

The MCP response uses text content containing JSON so clients can inspect it consistently. Tool failures set `isError` and return a stable error code with an actionable message.

## Error model

Errors are classified as invalid collection, request not found, ambiguous request, path outside collection, invalid input, execution timeout, CLI unavailable, and CLI execution failure. Expected user errors do not crash the stdio server. Unexpected errors are reduced to safe messages; stack traces are only emitted to stderr in debug mode.

## Testing

Unit tests cover scanning exclusions, path containment, symlink escapes, name resolution, ambiguity, common `.bru` parsing, output truncation, timeout handling, and argument construction. Integration tests use temporary Bruno fixtures and a fake CLI executable to verify MCP-facing behavior without network calls. A build, typecheck, lint, and complete test run gate publication.

## Documentation and release

The repository includes an English README optimized for open-source adoption: value proposition, quick start, client configuration examples, tool reference, security model, demo fixture, roadmap, contribution guide, and MIT license. The initial release is published as a public GitHub repository named `bruno-mcp-server`; npm publication is documented but not performed in this MVP.
