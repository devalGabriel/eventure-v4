import * as service from "../services/authService.js";
import { registerSchema, loginSchema } from "../validators/authSchemas.js";
import { publishEvent } from "../../../../libs/eventbus/index.js";

export const register = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    // 1) creează utilizatorul în DB (serviciul tău existent)
    const user = await service.registerUser(validated);
    // așteptat: user.id, user.email, user.fullName (dacă numele nu e prezent, folosește local-part-ul emailului)

    // 2) publică evenimentul către USERS (non-blocking; nu dăm fail dacă NATS e jos)
    try {
      const nats = req.app.get("nats");
      if (nats) {
        await publishEvent(
          nats,
          process.env.NATS_TOPIC_AUTH_USER_REGISTERED || "auth.user.registered",
          {
            authUserId: user.id,
            email: user.email,
            fullName: user.fullName || (user.email ? user.email.split("@")[0] : "User"),
          }
        );
      } else {
        console.warn("⚠️ No NATS connection available, skipping event publish");
      }
    } catch (pubErr) {
      console.error("⚠️ Failed to publish auth.user.registered:", pubErr?.message || pubErr);
      // nu aruncăm mai departe; înregistrarea rămâne reușită chiar dacă publish-ul a eșuat
    }

    // 3) răspunsul API rămâne identic cu versiunea ta
    res.status(201).json({ message: "User created", user });
  } catch (e) {
    next(e);
  }
};

export const login = async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await service.loginUser(validated);

    // cookies existente
    res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: "lax" });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "lax" });

    // ✅ cookie compatibil cu UI/middleware-ul tău
    res.cookie("evt_session", accessToken, { httpOnly: true, sameSite: "lax", path: "/" });

    res.json({ user, accessToken, refreshToken });
  } catch (e) { next(e); }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies || {};
    if (!refreshToken) {
      const e = new Error("No refresh token");
      e.status = 401;
      throw e;
    }
    const tokens = await service.refreshTokens(refreshToken);
    res.cookie("accessToken", tokens.accessToken, { httpOnly: true, sameSite: "lax" });
    res.json(tokens);
  } catch (e) { next(e); }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies || {};
    await service.logoutUser(refreshToken);

    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    // ✅ șterge și evt_session
    res.clearCookie("evt_session", { path: "/" });

    res.json({ message: "Logged out" });
  } catch (e) { next(e); }
};

export const me = async (req, res, next) => {
  try {
    const user = await service.getMe(req.user.id);
    res.json(user);
  } catch (e) { next(e); }
};

export const health = async (req, res) => {
  res.json({ status: "ok", service: "auth", time: new Date().toISOString() });
};
