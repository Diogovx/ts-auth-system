import argon2 from "argon2";

/**
 * Gera o hash de uma senha usando Argon2id (recomendação atual da OWASP),
 * mais resistente a ataques de GPU do que bcrypt.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, { type: argon2.argon2id });
}

/**
 * Compara uma senha em texto puro com o hash armazenado.
 */
export async function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    // Hash malformado ou incompatível — trata como senha inválida em vez de derrubar a request.
    return false;
  }
}
