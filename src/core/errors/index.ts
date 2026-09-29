/**
 * @file index.ts
 * @description Hierarchie des classes d'erreurs standardisees de l'application.
 * Permet une gestion uniforme des codes de statut HTTP et des messages
 * d'erreur renvoyes aux clients de l'API REST.
 */

/**
 * Classe d'erreur de base pour les erreurs metier et operationnelles de l'application.
 */
export class AppError extends Error {
  /** Code de statut HTTP associe a l'erreur (ex: 400, 404, 500) */
  public readonly statusCode: number;

  /** Indique si l'erreur est operationnelle (prevue) ou liee a un bogue non traite */
  public readonly isOperational: boolean;

  /** Details supplementaires sur l'erreur (ex: liste des champs invalides) */
  public readonly errors?: unknown;

  /**
   * Cree une nouvelle instance de AppError.
   * @param message Message descriptif de l'erreur
   * @param statusCode Code HTTP correspondant (par defaut 500)
   * @param errors Details contextuels optionnels
   */
  constructor(message: string, statusCode = 500, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur levee lorsqu'une ressource demandee est introuvable (HTTP 404).
 */
export class NotFoundError extends AppError {
  /**
   * @param message Message d'erreur personnalise
   */
  constructor(message = 'Ressource non trouvee') {
    super(message, 404);
  }
}

/**
 * Erreur levee lorsque l'utilisateur n'est pas authentifie (HTTP 401).
 */
export class UnauthorizedError extends AppError {
  /**
   * @param message Message d'erreur personnalise
   */
  constructor(message = 'Authentification requise') {
    super(message, 401);
  }
}

/**
 * Erreur levee lorsque l'utilisateur authentifie ne dispose pas des droits requis (HTTP 403).
 */
export class ForbiddenError extends AppError {
  /**
   * @param message Message d'erreur personnalise
   */
  constructor(message = 'Acces refuse : permissions insuffisantes') {
    super(message, 403);
  }
}

/**
 * Erreur levee lorsqu'une requete contient des parametres ou un corps invalide (HTTP 400).
 */
export class BadRequestError extends AppError {
  /**
   * @param message Message d'erreur personnalise
   * @param errors Details des erreurs de validation
   */
  constructor(message = 'Requete invalide', errors?: unknown) {
    super(message, 400, errors);
  }
}

/**
 * Erreur levee lors d'un conflit d'etat ou d'unicite avec une ressource existante (HTTP 409).
 */
export class ConflictError extends AppError {
  /**
   * @param message Message d'erreur personnalise
   */
  constructor(message = 'Conflit avec une ressource existante') {
    super(message, 409);
  }
}
