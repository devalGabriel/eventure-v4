import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "../../src/routes/authRoutes.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";

export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/auth", authRoutes);
  app.use(errorHandler);
  return app;
}
