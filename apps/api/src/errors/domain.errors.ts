export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {}
export class ConflictError extends DomainError {}
export class UnauthorizedError extends DomainError {}
export class TooManyRequestsError extends DomainError {}
export class ForbiddenError extends DomainError {}
export class BadRequestError extends DomainError {}
