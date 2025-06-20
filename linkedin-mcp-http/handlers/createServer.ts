import { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import dotenv from "dotenv";

import {
    loginLinkedIn,
    handleLinkedInCallback,
    checkLinkedInAuth,
    logoutLinkedIn,
} from "../tools/auth";
import { createPost, PostVisibility } from "../tools/posts";
import { getPersonUrn, diagnosticUserInfo } from "../tools/linkedinAdapter";

dotenv.config();

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;

export async function createMcpServerIfNeeded(
    request: FastifyRequest,
    reply: FastifyReply,
    transports: { [key: string]: StreamableHTTPServerTransport }
): Promise<StreamableHTTPServerTransport | null> {
    const sessionId = request.headers["mcp-session-id"] as string | undefined;
    if (sessionId && transports[sessionId]) {
        return transports[sessionId];
    }

    if (!sessionId && isInitializeRequest(request.body)) {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
                transports[id] = transport;
            }
        });

        transport.onclose = () => {
            if (transport.sessionId) {
                delete transports[transport.sessionId];
            }
        };

        const server = new McpServer({
            name: "LinkedInMCP",
            version: "1.0.0",
            description: "Serveur MCP pour interagir avec LinkedIn"
        });

        server.tool("linkedin_login", async () => {
            const result = await loginLinkedIn(LINKEDIN_CLIENT_ID, LINKEDIN_REDIRECT_URI);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        message: "Pour vous connecter à LinkedIn, ouvrez cette URL dans votre navigateur",
                        authUrl: result.authUrl,
                        state: result.state,
                        instructions: "Après vous être connecté, copiez le code et l'état de l'URL et utilisez-les avec l'outil linkedin_callback."
                    })
                }]
            };
        });

        server.tool("linkedin_callback",
            {
                code: z.string().describe("Code d'autorisation"),
                state: z.string().describe("État de la requête"),
            },
            async ({ code, state }) => {
                const result = await handleLinkedInCallback(code, state);

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result)
                    }]
                };
            }
        );

        server.tool("linkedin_check_auth", {}, async () => {
            const result = await checkLinkedInAuth();

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result)
                }]
            };
        });

        server.tool("linkedin_logout", {}, async () => {
            const result = await logoutLinkedIn();

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result)
                }]
            };
        });

        server.tool("linkedin_create_post",
            {
                text: z.string(),
                visibility: z.enum(["PUBLIC", "CONNECTIONS"]).default("PUBLIC"),
                mediaUrls: z.array(z.string()).optional()
            },
            async ({ text, visibility, mediaUrls }) => {
                const result = await createPost(text, visibility as PostVisibility, mediaUrls);

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result)
                    }]
                };
            }
        );

        server.tool("linkedin_get_person_urn", {}, async () => {
            const urn = await getPersonUrn();

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(urn)
                }]
            };
        });

        server.tool("linkedin_diagnostic_user_info", {}, async () => {
            const result = await diagnosticUserInfo();

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };
        });

        await server.connect(transport);
        return transport;
    }

    reply.code(400).send({
        jsonrpc: "2.0",
        error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided"
        },
        id: null
    });

    return null;
}
