import { describe, it, expect } from "vitest";
import { signAccessToken, verifyAccessToken } from "../src/utils/jwt";
import { Role } from "@prisma/client";

describe("access tokens (JWT)", () => {
  const payload = { sub: "user-123", email: "teste@example.com", role: Role.USER };

  it("assina e verifica um token corretamente", () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("lança erro ao verificar um token adulterado", () => {
    const token = signAccessToken(payload);
    const tampered = token.slice(0, -2) + "xx";

    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});
