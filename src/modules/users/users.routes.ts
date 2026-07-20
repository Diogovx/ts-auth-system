import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { prisma } from "../../lib/prisma";

const router = Router();

// GET /api/users/me -> retorna o perfil do usuário autenticado
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return res.json(user);
  } catch (err) {
    next(err);
    return;
  }
});

export default router;
