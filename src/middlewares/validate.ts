import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Middleware genérico que valida `body`/`query`/`params` usando um schema Zod
 * no formato { body: ..., query: ..., params: ... }.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
      return;
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: err.issues.map((issue) => ({
            field: issue.path.slice(1).join("."),
            message: issue.message,
          })),
        });
      }
      next(err);
      return;
    }
  };
}
