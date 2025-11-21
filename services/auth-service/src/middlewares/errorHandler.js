import { ZodError } from "zod";

export const errorHandler = (err, req, res, next) => {
  // Zod validation → 400 + detalii
  if (err instanceof ZodError) {
    const issues = err.issues?.map(i => ({ path: i.path.join("."), message: i.message })) || [];
    return res.status(400).json({ message: "Validation error", issues });
  }

  // Prisma duplicate key (fallback, dacă nu setăm noi status 409 în service)
  if (err.code === "P2002") {
    return res.status(409).json({ message: "Unique constraint failed" });
  }

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "test") console.error("Error:", status, message, err.stack || "");
  return res.status(status).json({ message });
};
