import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { listBrunoRequests, getBrunoRequestDetail, runBrunoRequest } from "./tools.js";
import { BrunoMcpError } from "./errors.js";

// Zod schemas for input validation
const listRequestsSchema = z.object({
  project_path: z.string().optional(),
});

const getRequestDetailSchema = z.object({
  request_name: z.string(),
  project_path: z.string().optional(),
});

const runRequestSchema = z.object({
  request_name: z.string(),
  project_path: z.string().optional(),
  env: z.string().optional(),
  env_vars: z.record(z.string()).optional(),
});

export function startMcpServer(defaultProjectPath?: string): Server {
  const server = new Server(
    {
      name: "bruno-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 1. List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_bruno_requests",
          description: "List all Bruno request files in the collection root. Optionally specify a project_path.",
          inputSchema: {
            type: "object",
            properties: {
              project_path: {
                type: "string",
                description: "Optional absolute path to the Bruno collection root. Defaults to the configured project path or current working directory.",
              },
            },
          },
        },
        {
          name: "get_bruno_request_detail",
          description: "Get structured details and raw content of a specific Bruno request file.",
          inputSchema: {
            type: "object",
            properties: {
              request_name: {
                type: "string",
                description: "The name of the request (slash-separated relative path without extension, e.g. 'users/get-profile', or unique file basename).",
              },
              project_path: {
                type: "string",
                description: "Optional absolute path to the Bruno collection root.",
              },
            },
            required: ["request_name"],
          },
        },
        {
          name: "run_bruno_request",
          description: "Execute a Bruno API request using the local Bruno CLI and get status and outputs.",
          inputSchema: {
            type: "object",
            properties: {
              request_name: {
                type: "string",
                description: "The name of the request to run.",
              },
              project_path: {
                type: "string",
                description: "Optional absolute path to the Bruno collection root.",
              },
              env: {
                type: "string",
                description: "Optional environment name (e.g. 'local', 'staging').",
              },
              env_vars: {
                type: "object",
                description: "Optional key-value overrides for environment variables.",
                additionalProperties: { type: "string" },
              },
            },
            required: ["request_name"],
          },
        },
      ],
    };
  });

  // 2. Call tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;

      if (name === "list_bruno_requests") {
        const validated = listRequestsSchema.parse(args || {});
        const result = await listBrunoRequests({
          projectPath: validated.project_path || defaultProjectPath,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "get_bruno_request_detail") {
        const validated = getRequestDetailSchema.parse(args || {});
        const result = await getBrunoRequestDetail({
          requestName: validated.request_name,
          projectPath: validated.project_path || defaultProjectPath,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "run_bruno_request") {
        const validated = runRequestSchema.parse(args || {});
        const result = await runBrunoRequest({
          requestName: validated.request_name,
          projectPath: validated.project_path || defaultProjectPath,
          env: validated.env,
          envVars: validated.env_vars,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      throw new BrunoMcpError("INVALID_INPUT", `Unknown tool name: ${name}`);
    } catch (err: any) {
      let errorCode = "INTERNAL_ERROR";
      let message = err.message || "An unexpected error occurred.";

      if (err instanceof BrunoMcpError) {
        errorCode = err.code;
      } else if (err instanceof z.ZodError) {
        errorCode = "INVALID_INPUT";
        message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: errorCode,
                message,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function runServer(defaultProjectPath?: string) {
  const server = startMcpServer(defaultProjectPath);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bruno MCP Server running on stdio transport.");
}
