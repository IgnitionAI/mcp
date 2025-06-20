import { FastifyRequest, FastifyReply } from "fastify";
import { handleSessionRequest } from "../handlers/sessionHandler";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";

class MockTransport extends StreamableHTTPServerTransport {
    handleRequest = jest.fn();
    constructor() {
        super({ sessionIdGenerator: () => "mock-id" });
    }
}

describe("handleSessionRequest", () => {
    it("responds with 400 if sessionId is missing", async () => {
        const request = {
            headers: {}
        } as unknown as FastifyRequest;
        const reply = {
            code: jest.fn().mockReturnThis(),
            send: jest.fn()
        } as unknown as FastifyReply;

        await handleSessionRequest(request, reply, {});
        expect(reply.code).toHaveBeenCalledWith(400);
        expect(reply.send).toHaveBeenCalledWith("Invalid or missing session ID");
    });

    it("handles request if session exists", async () => {
        const mockTransport = new MockTransport();
        const request = {
            headers: { "mcp-session-id": "123" },
            raw: {}
        } as unknown as FastifyRequest;
        const reply = {
            raw: {}
        } as unknown as FastifyReply;

        const transports: { [key: string]: StreamableHTTPServerTransport } = {
            "123": mockTransport
        };

        await handleSessionRequest(request, reply, transports);
        expect(mockTransport.handleRequest).toHaveBeenCalledWith(request.raw, reply.raw);
    });
});
