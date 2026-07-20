import { prisma } from "../../lib/prisma";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signAccessToken } from "../../utils/jwt";
import { generateRefreshToken, hashRefreshToken, refreshTokenExpiryDate } from "../../utils/refreshToken";
import { HttpError } from "../../middlewares/errorHandler";
import { RegisterInput, LoginInput } from "./auth.validation";
import { Role } from "@prisma/client";

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

interface AuthResult {
  user: { id: string; email: string; name: string | null; role: Role };
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new HttpError(409, "Este e-mail já está cadastrado.");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash, name: input.name },
    });

    return this.issueTokens(user, {});
  }

  async login(input: LoginInput, ctx: RequestContext): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    const isValid = user ? await verifyPassword(user.passwordHash, input.password) : false;

    // Registra a tentativa de login independentemente do resultado — essencial para auditoria.
    await prisma.loginLog.create({
      data: {
        userId: user?.id,
        emailAttempted: input.email,
        success: isValid,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    });

    if (!user || !isValid) {
      throw new HttpError(401, "E-mail ou senha inválidos.");
    }

    if (!user.isActive) {
      throw new HttpError(403, "Esta conta está desativada.");
    }

    return this.issueTokens(user, ctx);
  }

  /**
   * Recebe o refresh token opaco vindo do cookie, valida contra o hash salvo,
   * e caso válido faz a ROTAÇÃO: revoga o token antigo e emite um novo par
   * (access + refresh). Se o token já estiver revogado, isso é tratado como
   * possível roubo de token e TODOS os refresh tokens do usuário são revogados.
   */
  async refresh(rawToken: string, ctx: RequestContext): Promise<AuthResult> {
    const tokenHash = hashRefreshToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new HttpError(401, "Refresh token inválido.");
    }

    if (stored.revokedAt) {
      // Reuso de um token já revogado = possível token roubado. Revoga tudo por segurança.
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new HttpError(401, "Refresh token já utilizado. Todas as sessões foram encerradas por segurança.");
    }

    if (stored.expiresAt < new Date()) {
      throw new HttpError(401, "Refresh token expirado. Faça login novamente.");
    }

    const newRawToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRawToken);
    const newExpiresAt = refreshTokenExpiryDate();

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date(), replacedByTokenHash: newTokenHash },
      }),
      prisma.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
          createdByIp: ctx.ipAddress,
        },
      }),
    ]);

    const accessToken = signAccessToken({
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
    });

    return {
      user: {
        id: stored.user.id,
        email: stored.user.email,
        name: stored.user.name,
        role: stored.user.role,
      },
      accessToken,
      refreshToken: newRawToken,
      refreshTokenExpiresAt: newExpiresAt,
    };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const tokenHash = hashRefreshToken(rawToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    user: { id: string; email: string; name: string | null; role: Role },
    ctx: RequestContext
  ): Promise<AuthResult> {
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });

    const rawRefreshToken = generateRefreshToken();
    const refreshTokenExpiresAt = refreshTokenExpiryDate();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(rawRefreshToken),
        expiresAt: refreshTokenExpiresAt,
        createdByIp: ctx.ipAddress,
      },
    });

    return { user, accessToken, refreshToken: rawRefreshToken, refreshTokenExpiresAt };
  }
}
