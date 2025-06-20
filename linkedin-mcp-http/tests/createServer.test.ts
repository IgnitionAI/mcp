import { createMcpServerIfNeeded } from "../handlers/createServer";
import { FastifyRequest, FastifyReply } from "fastify";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types";

jest.mock("@modelcontextprotocol/sdk/types", () => ({
    isInitializeRequest: jest.fn(),
}));

describe("createMcpServerIfNeeded", () => {
    it("returns existing transport for valid sessionId", async () => {
        const dummyTransport = {} as any;
        const transports = { "abc123": dummyTransport };

        const request = {
            headers: {
                "mcp-session-id": "abc123"
            }
        } as unknown as FastifyRequest;

        const reply = {} as unknown as FastifyReply;

        const result = await createMcpServerIfNeeded(request, reply, transports);
        expect(result).toBe(dummyTransport);
    });

    it("returns 400 when no sessionId and not an initialize request", async () => {
        (isInitializeRequest as unknown as jest.Mock).mockReturnValue(false);

        const request = {
            headers: {},
            body: {}
        } as unknown as FastifyRequest;

        const sendMock = jest.fn();
        const reply = {
            code: jest.fn().mockReturnThis(),
            send: sendMock
        } as unknown as FastifyReply;

        const result = await createMcpServerIfNeeded(request, reply, {});
        expect(reply.code).toHaveBeenCalledWith(400);
        expect(sendMock).toHaveBeenCalledWith({
            jsonrpc: "2.0",
            error: {
                code: -32000,
                message: "Bad Request: No valid session ID provided"
            },
            id: null
        });
        expect(result).toBe(null);
    });
});
