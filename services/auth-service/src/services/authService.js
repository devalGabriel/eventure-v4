import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const prisma = new PrismaClient();

export const registerUser = async ({ email, password, name }) => {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    const e = new Error("Email already exists");
    e.status = 409;
    throw e;
  }
  const hashed = await hashPassword(password);
  const user = prisma.user.create({ data: { email, password: hashed, name } });
  
  // ✅ publish user.created cu import DINAMIC (evită parsarea eventbus în Jest)
  if (process.env.NODE_ENV !== "test") {
    try {
      const { publishEvent } = await import("../../../../libs/eventbus/index.js");
      await publishEvent("user.created", {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt,
      });
    } catch (err) {
      // nu blocăm signup-ul dacă event bus e jos
      console.warn("⚠️ Failed to publish user.created:", err.message);
    }
  }

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  console.log('Attempting login for user:', email);
  console.log('User found:', user);
  if (!user) {
    const e = new Error("Invalid credentials");
    e.status = 401;
    throw e;
  }
  const match = await comparePassword(password, user.password);
  if (!match) {
    const e = new Error("Invalid credentials");
    e.status = 401;
    throw e;
  }
  console.log('User authenticated:', user.id);
  console.log('User role:', user.role);
  const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });
  const refreshToken = generateRefreshToken({ id: user.id });

  const expires = new Date();
  // 10 zile valabilitate
  expires.setDate(expires.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS, 10 ));
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: expires },
  });

  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken };
};

export const refreshTokens = async (token) => {
  if (!token) {
    const e = new Error("No refresh token");
    e.status = 401;
    throw e;
  }

  // există în DB?
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored) {
    const e = new Error("Invalid refresh token");
    e.status = 401;
    throw e;
  }

  // e valid/neviciat?
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    const e = new Error("Invalid or expired refresh token");
    e.status = 401;
    throw e;
  }

  // mai există userul?
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }

  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  return { accessToken };
};


export const logoutUser = async (token) => {
  if (!token) return;
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const getMe = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, verified: true },
  });
