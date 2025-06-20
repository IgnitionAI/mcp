import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { handleSessionRequest } from "./handlers/sessionHandler";
import { createMcpServerIfNeeded } from "./handlers/createServer";
import pino from "pino";

export function createServer() {
    const transport = pino.transport({
        target: "pino-pretty",
        options: {
            colorize: true,
            forceColor: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
        }
    });
    const fastify = Fastify({
        logger: transport
    });
    const transports = {};

    fastify.post("/mcp", async (request: FastifyRequest, reply: FastifyReply) => {
        const transport = await createMcpServerIfNeeded(request, reply, transports);
        if (transport) {
            await transport.handleRequest(request.raw, reply.raw, request.body);
        }
    });
    fastify.get("/mcp", (request: FastifyRequest, reply: FastifyReply) => handleSessionRequest(request, reply, transports));
    fastify.delete("/mcp", (request: FastifyRequest, reply: FastifyReply) => handleSessionRequest(request, reply, transports));

    return fastify;
}

if (require.main === module) {
    const server = createServer();

    server.listen({ port: 3000 }, (err, address) => {
        if (err) {
            process.exit(1);
        }

        console.log(`🚀 LinkedIn MCP server running at ${address}`);
    })
}
