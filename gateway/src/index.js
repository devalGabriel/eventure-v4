import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config({ path: "../.env.master" });
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// 🔐 AUTH SERVICE
app.use("/auth", createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
  changeOrigin: true
}));

// 👤 USER SERVICE
app.use("/user", createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || "http://localhost:4002",
  changeOrigin: true
}));

app.get("/", (_, res) => res.send("Gateway active — Eventure v4"));

app.listen(process.env.GATEWAY_PORT, () =>
  console.log(`🌐 Gateway running on port ${process.env.GATEWAY_PORT}`)
);
