import { Router } from "express";
import { register, login, refresh, logout, me, health } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Health
router.get("/health", health);

// --- REGISTER ---
// existent
router.post("/register", register);
// ✅ aliasuri pentru UI: /auth/sign-up, /auth/signup
router.post("/sign-up", register);
router.post("/signup", register);

// --- LOGIN ---
// existent
router.post("/login", login);
// ✅ aliasuri pentru UI: /auth/sign-in, /auth/signin
router.post("/sign-in", login);
router.post("/signin", login);

// --- REFRESH ---
router.post("/refresh", refresh);

// --- LOGOUT ---
router.post("/logout", logout);
// ✅ alias pentru UI: /auth/sign-out
router.post("/sign-out", logout);
router.post("/signout", logout);

// --- ME ---
// Acceptă authMiddleware, care acum vede și evt_session (vezi patch-ul #2)
router.get("/me", authMiddleware, me);

export default router;
