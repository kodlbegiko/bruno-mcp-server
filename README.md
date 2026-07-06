# Bruno MCP Server

A local-first, secure **Model Context Protocol (MCP)** server that enables AI coding assistants (like Cursor, Claude Desktop, and Aider) to discover, inspect, and run API requests in your **Bruno** collections entirely locally.

![Bruno MCP Server self-healing demo](./docs/images/demo.gif)

---

## Key Features

- **Local-First & Private**: Executes API calls locally on your machine using your own local Bruno files and environments. No credentials or source files are sent to a cloud service.
- **Universal Connection (MCP)**: Standardizes how AI coding agents query, analyze, and verify your back-end APIs.
- **Tolerant Parsing**: Extracts metadata (URL, headers, body types, bearer tokens) from `.bru` files while preserving the exact raw contents.
- **Process Sandbox**: Executes requests by calling your project-local `@usebruno/cli` directly with no shell interpolation, protecting against command injection.

---

## Installation

### Prerequisites
- Node.js >= 20.0.0
- A Bruno collection initialized in your workspace.

### Running from source

The npm package name `bruno-mcp-server` is currently owned by another project. Clone this repository to ensure you run this implementation:

```bash
git clone https://github.com/kodlbegiko/bruno-mcp-server.git
cd bruno-mcp-server
npm ci
npm run build
node dist/index.js --project-path /absolute/path/to/your/bruno-collection
```

---

## Client Configuration

### 1. Cursor
To configure the server in **Cursor**, open Settings -> Features -> MCP, click **+ Add New MCP Tool**, and fill in the details:
- **Name**: `bruno`
- **Type**: `stdio`
- **Command**: `node /absolute/path/to/bruno-mcp-server/dist/index.js --project-path /absolute/path/to/your/bruno-collection`

### 2. Claude Desktop
Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bruno": {
      "command": "node",
      "args": [
        "/absolute/path/to/bruno-mcp-server/dist/index.js",
        "--project-path",
        "/absolute/path/to/your/bruno-collection"
      ]
    }
  }
}
```

## Try the Self-Healing Demo

To see the AI agent automatically debug and heal code using this MCP server:

1. **Start the Mock Server**:
   ```bash
   node fixtures/demo/server.js
   ```
2. **Introduce a Bug**:
   Open `fixtures/demo/server.js` and change `payload.email` to `payload.mail` in the registration handler.
3. **Ask the AI**:
   In Cursor or Claude, ask:
   > *"I just modified the register endpoint in fixtures/demo/server.js. Please use the Bruno MCP tool to run the 'Register' request in fixtures/demo/ to check if it passes."*
4. **Watch it Heal**:
   The AI agent will call the MCP tool, detect the `400` failure, inspect `server.js`, fix the typo back to `payload.email`, re-run the request, and confirm the test passes!

---

## Tool Reference

### 1. `list_bruno_requests`
Discovers and lists all `.bru` request files inside the collection root.
- **Inputs**:
  - `project_path` (string, optional)
- **Output**:
  - A JSON array listing request names, paths, and detected HTTP methods.

### 2. `get_bruno_request_detail`
Extracts structured request details (URL, headers, body, auth parameters) and raw content.
- **Inputs**:
  - `request_name` (string, required) - The name (relative path without extension, or unique basename) of the request.
  - `project_path` (string, optional)

### 3. `run_bruno_request`
Runs a request locally through the Bruno CLI and captures status and outputs.
- **Inputs**:
  - `request_name` (string, required)
  - `project_path` (string, optional)
  - `env` (string, optional) - Target environment defined in your collection.
  - `env_vars` (object, optional) - Key-value overrides for environment variables.

---

## Development & Contribution

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, testing, and contribution protocols.

## License
MIT License. See [LICENSE](./LICENSE) for details.
