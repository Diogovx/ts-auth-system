import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { setRefreshTokenCookie, clearRefreshTokenCookie } from "../../utils/cookies";
import { env } from "../../config/env";

const authService = new AuthService();

function requestContext(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
      return res.status(201).json({ user: result.user, accessToken: result.accessToken });
    } catch (err) {
      next(err);
      return;
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body, requestContext(req));
      setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
      return res.status(200).json({ user: result.user, accessToken: result.accessToken });
    } catch (err) {
      next(err);
      return;
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = req.cookies?.[env.refreshCookieName];
      if (!rawToken) {
        return res.status(401).json({ error: "Refresh token ausente." });
      }

      const result = await authService.refresh(rawToken, requestContext(req));
      setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
      return res.status(200).json({ user: result.user, accessToken: result.accessToken });
    } catch (err) {
      next(err);
      return;
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = req.cookies?.[env.refreshCookieName];
      await authService.logout(rawToken);
      clearRefreshTokenCookie(res);
      return res.status(204).send();
    } catch (err) {
      next(err);
      return;
    }
  }
}
