import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const incoming = req.headers['x-request-id'];
  const requestId =
    typeof incoming === 'string' && incoming.trim() ? incoming : randomUUID();

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
