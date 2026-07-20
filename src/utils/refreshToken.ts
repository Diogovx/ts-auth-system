import crypto from "node:crypto";
import { env } from "../config/env";

/**
 * O refresh token entregue ao cliente é uma string aleatória opaca (não é um JWT).
 * No banco, guardamos apenas o hash SHA-256 dele — assim, mesmo em caso de
 * vazamento do banco de dados, não é possível reconstruir os tokens válidos.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiryDate(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + env.refreshTokenExpiresInDays);
  return expires;
}
