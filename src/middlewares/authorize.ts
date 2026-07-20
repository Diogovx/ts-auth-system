import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

/**
 * Exige que o usuário autenticado tenha um dos roles permitidos.
 * Deve ser usado sempre depois do middleware `authenticate`.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Não autenticado." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Você não tem permissão para acessar este recurso." });
    }

    return next();
  };
}
