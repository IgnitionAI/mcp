import { FastifyRequest, FastifyReply } from "fastify";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";


export async function handleSessionRequest(
    request: FastifyRequest,
    reply: FastifyReply,
    transports: { [key: string]: StreamableHTTPServerTransport }
): Promise<void> {
    const sessionId = request.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
        reply.code(400).send("Invalid or missing session ID");
        return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(request.raw, reply.raw);
}
