import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

/**
 * Exige um access token válido no header "Authorization: Bearer <token>".
 * Popula `req.user` para uso nas rotas seguintes.
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acesso ausente." });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: "Token de acesso inválido ou expirado." });
  }
}
