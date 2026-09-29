/**
 * @file validate.middleware.ts
 * @description Middleware Express pour la validation declarative des requetes HTTP via Zod.
 * Verifie la conformite du corps (body), des parametres de route (params) et
 * de la chaine de requete (query) avant d'atteindre les controleurs metier.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { BadRequestError } from '../errors';

/**
 * Fabrique de middleware de validation basee sur un schema Zod.
 *
 * @param schema Schema Zod decrivant la structure attendue de la requete
 * @returns Middleware Express qui valide ou transmet une erreur BadRequestError
 */
export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.slice(1).join('.'),
          message: err.message,
        }));
        next(new BadRequestError('Donnees de requete non valides', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};
