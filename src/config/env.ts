import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),

  databaseUrl: required("DATABASE_URL"),

  jwtAccessSecret: required("JWT_ACCESS_SECRET", "dev-access-secret-troque-isso"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",

  refreshTokenExpiresInDays: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 30),
  refreshCookieName: "refreshToken",

  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",

  // Rate limiting
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 5),
  globalRateLimitWindowMs: Number(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS ?? 60 * 1000),
  globalRateLimitMax: Number(process.env.GLOBAL_RATE_LIMIT_MAX ?? 100),

  // Usuário admin criado pelo script de seed (opcional)
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345",
};

export const isProduction = env.nodeEnv === "production";
