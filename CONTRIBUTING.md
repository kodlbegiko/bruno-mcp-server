# Contributing to Bruno MCP Server

Thank you for your interest in contributing to Bruno MCP Server! Below is a guide to getting set up locally and submitting pull requests.

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kodlbegiko/bruno-mcp-server.git
   cd bruno-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify the installation**:
   Run the full verification suite (linting, typechecking, testing, building):
   ```bash
   ./node_modules/.bin/tsc --noEmit
   ./node_modules/.bin/eslint src/
   ./node_modules/.bin/vitest run
   ```

## Development Workflow

- **Unit Tests**: Add tests under `tests/` for any new parser rules, path resolution behaviors, or runner arguments.
- **Strict Linting**: Ensure your code is free of unused variables and adheres to TypeScript guidelines before committing.
- **Safety**: Do not introduce any shell commands or bypass target collection containment.

## Pull Request Guidelines

- Ensure all checks pass (`npm run typecheck && npm run lint && npm run build && npm run test`).
- Open a draft PR first if your work is a work-in-progress, and convert it to ready-for-review when completed.
