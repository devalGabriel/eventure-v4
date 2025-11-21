// services/auth-service/src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice('Bearer '.length)
      : null;

    const cookieAccess = req.cookies?.accessToken || null;
    const cookieEvt = req.cookies?.evt_session || null;

    const token = bearer || cookieAccess || cookieEvt;
    if (!token) return res.status(401).json({ code: 'ERR_UNAUTHORIZED' });

    // ✅ trebuie să fie ACELAȘI secret folosit la sign()
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = { id: payload.sub || payload.id || payload.userId, ...payload };
    next();
  } catch {
    return res.status(401).json({ code: 'ERR_UNAUTHORIZED' });
  }
};
