import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { prisma } from "../../lib/prisma";
import { Role } from "@prisma/client";

const router = Router();

// Todas as rotas abaixo exigem autenticação + role ADMIN
router.use(authenticate, authorize(Role.ADMIN));

// GET /api/admin/users -> lista todos os usuários
router.get("/users", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(users);
  } catch (err) {
    next(err);
    return;
  }
});

// GET /api/admin/login-logs -> histórico de tentativas de login (sucesso e falha)
router.get("/login-logs", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const logs = await prisma.loginLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true } } },
    });
    return res.json(logs);
  } catch (err) {
    next(err);
    return;
  }
});

export default router;
