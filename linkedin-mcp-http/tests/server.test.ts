import supertest from "supertest";
import { createServer } from "../server";

let app: ReturnType<typeof createServer>;

beforeAll(async () => {
    app = createServer();
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

describe("Fastify MCP Server", () => {
    test("returns 400 for missing sessionId on POST /mcp", async () => {
        const response = await supertest(app.server)
            .post("/mcp")
            .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.error.message).toMatch(/no valid session id/i);
    });

    test("returns 400 on GET /mcp with missing session ID", async () => {
        const response = await supertest(app.server).get("/mcp");

        expect(response.statusCode).toBe(400);
        expect(response.text).toBe("Invalid or missing session ID");
    });
});
