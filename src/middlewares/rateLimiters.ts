import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/**
 * Limite geral, aplicado a toda a API — protege contra abuso básico.
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.globalRateLimitWindowMs,
  limit: env.globalRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em instantes." },
});

/**
 * Limite mais rígido para login/registro — principal defesa contra
 * força bruta de senha e criação em massa de contas falsas.
 */
export const authRateLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { error: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente." },
});
