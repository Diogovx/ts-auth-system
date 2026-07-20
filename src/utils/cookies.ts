import { Response } from "express";
import { env, isProduction } from "../config/env";

const COOKIE_PATH = "/api/auth"; // o cookie só é enviado de volta para rotas de auth (refresh/logout)

export function setRefreshTokenCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(env.refreshCookieName, token, {
    httpOnly: true,
    secure: isProduction, // exige HTTPS em produção
    sameSite: "strict",
    path: COOKIE_PATH,
    expires: expiresAt,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(env.refreshCookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: COOKIE_PATH,
  });
}
