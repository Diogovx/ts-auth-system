import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/utils/password";
import { generateRefreshToken, hashRefreshToken } from "../src/utils/refreshToken";

describe("password hashing", () => {
  it("gera um hash diferente da senha original", async () => {
    const hash = await hashPassword("MinhaSenh@123");
    expect(hash).not.toBe("MinhaSenh@123");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("verifica corretamente uma senha válida", async () => {
    const hash = await hashPassword("MinhaSenh@123");
    await expect(verifyPassword(hash, "MinhaSenh@123")).resolves.toBe(true);
  });

  it("rejeita uma senha incorreta", async () => {
    const hash = await hashPassword("MinhaSenh@123");
    await expect(verifyPassword(hash, "SenhaErrada")).resolves.toBe(false);
  });

  it("não derruba a aplicação com um hash malformado", async () => {
    await expect(verifyPassword("hash-invalido", "qualquer-senha")).resolves.toBe(false);
  });
});

describe("refresh tokens", () => {
  it("gera tokens aleatórios diferentes a cada chamada", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
    expect(a).toHaveLength(128); // 64 bytes em hex
  });

  it("gera sempre o mesmo hash para o mesmo token (determinístico)", () => {
    const token = generateRefreshToken();
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
  });

  it("gera hashes diferentes para tokens diferentes", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(hashRefreshToken(a)).not.toBe(hashRefreshToken(b));
  });
});
