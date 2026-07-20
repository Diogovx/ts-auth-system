import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string; // userId
  role: Role;
  email: string;
}

/**
 * Gera o access token (curta duração). Ele é enviado no corpo da resposta
 * e usado pelo cliente no header "Authorization: Bearer <token>".
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtAccessExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.jwtAccessSecret, options);
}

/**
 * Verifica e decodifica um access token. Lança se for inválido/expirado.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
}
