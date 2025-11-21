import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createTestApp } from "./helpers/app.js";

const prisma = new PrismaClient();
const app = createTestApp();

/**
 * Utility: creează un agent Supertest care reține cookie-urile între request-uri.
 */
const agent = request.agent(app);

beforeAll(async () => {
  // asigură DB curată
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // izolăm testele între ele
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

describe("AUTH SERVICE – MOD 01", () => {
  const user = { name: "Tester", email: "test@test.com", password: "123456" };
  const wrongPwd = "badpass";

  it("GET /auth/health → 200", async () => {
    const res = await request(app).get("/auth/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("POST /auth/register → 201 (user creat)", async () => {
    const res = await request(app).post("/auth/register").send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body?.user?.email).toBe(user.email);
  });

  it("POST /auth/register → 409 (email dublat)", async () => {
    await request(app).post("/auth/register").send(user);
    const res = await request(app).post("/auth/register").send(user);
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/exists|Unique/i);
  });

  it("POST /auth/register → 400 (validare Zod – email invalid)", async () => {
    const res = await request(app).post("/auth/register").send({ ...user, email: "nope" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Validation error");
    expect(Array.isArray(res.body.issues)).toBe(true);
  });

  it("POST /auth/login → 200 (login corect, primește tokens + setează cookies)", async () => {
    await request(app).post("/auth/register").send(user);
    const res = await agent.post("/auth/login").send({ email: user.email, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringMatching(/^accessToken=/), expect.stringMatching(/^refreshToken=/)])
    );
  });

  it("POST /auth/login → 401 (parolă greșită)", async () => {
    await request(app).post("/auth/register").send(user);
    const res = await request(app).post("/auth/login").send({ email: user.email, password: wrongPwd });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Invalid credentials/i);
  });

  it("GET /auth/me → 200 (cu Bearer accessToken)", async () => {
    await request(app).post("/auth/register").send(user);
    const login = await request(app).post("/auth/login").send({ email: user.email, password: user.password });
    const token = login.body.accessToken;
    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(user.email);
  });

  it("GET /auth/me → 401 (fără token)", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.statusCode).toBe(401);
  });

  it("POST /auth/refresh → 200 (primește access nou și setează cookie)", async () => {
    await request(app).post("/auth/register").send(user);
    // login cu agent → reține cookies (access+refresh)
    await agent.post("/auth/login").send({ email: user.email, password: user.password });

    const res = await agent.post("/auth/refresh").send();
    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    // set-cookie cu noul accessToken
    expect(res.headers["set-cookie"]).toEqual(expect.arrayContaining([expect.stringMatching(/^accessToken=/)]));
  });

  it("POST /auth/logout → 200 (șterge sesiunea și curăță cookie-urile)", async () => {
    await request(app).post("/auth/register").send(user);
    await agent.post("/auth/login").send({ email: user.email, password: user.password });

    const res = await agent.post("/auth/logout").send();
    expect(res.statusCode).toBe(200);
    // după logout, refresh-ul ar trebui să nu mai fie valid
    const res2 = await agent.post("/auth/refresh").send();
    expect([401, 403]).toContain(res2.statusCode);
  });
});
