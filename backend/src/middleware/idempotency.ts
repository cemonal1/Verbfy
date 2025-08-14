import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { IdempotencyKey } from '../models/IdempotencyKey';

const IDEMPOTENCY_HEADER = 'idempotency-key';

function hashRequestBody(body: any): string {
  try {
    const json = JSON.stringify(body ?? {});
    return crypto.createHash('sha256').update(json).digest('hex');
  } catch {
    return '';
  }
}

// Apply to safe-to-retry state-changing endpoints (POST/PUT/PATCH/DELETE)
export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next();

  // Skip for known non-idempotent integrations or special routes if needed
  const path = req.path || '';
  if (path.startsWith('/api/payments/webhook')) return next();

  const headerKey = (req.headers[IDEMPOTENCY_HEADER] as string | undefined) || (req.headers[IDEMPOTENCY_HEADER.toLowerCase()] as string | undefined);
  if (!headerKey) return next();

  const userId = (req as any).user?.id || null;
  const requestHash = hashRequestBody(req.body);
  const ttlMinutes = parseInt(process.env.IDEMPOTENCY_TTL_MINUTES || '30', 10);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  try {
    // Try to create a record; if exists, we will load it
    const created = await IdempotencyKey.create({
      key: headerKey,
      userId,
      method,
      path,
      requestHash,
      status: 'in_progress',
      expiresAt,
    });

    // Attach helper to store response later
    (req as any)._idempotencyRecordId = created._id;
    return next();
  } catch (err: any) {
    // Likely duplicate key; retrieve prior
    const existing = await IdempotencyKey.findOne({ key: headerKey, userId });
    if (existing && existing.status === 'completed') {
      // Serve cached response
      if (typeof existing.responseStatus === 'number') {
        return res.status(existing.responseStatus).json(existing.responseBody ?? {});
      }
      return res.json(existing.responseBody ?? {});
    }
    // If in_progress, instruct client to retry later
    return res.status(409).json({ success: false, message: 'Request is already in progress. Please retry.' });
  }
}

// Helper to persist successful responses
export async function saveIdempotentResponse(req: Request, res: Response, payload: any, statusCode?: number) {
  try {
    const recordId = (req as any)._idempotencyRecordId as string | undefined;
    if (!recordId) return; // header might be missing; nothing to do
    await IdempotencyKey.findByIdAndUpdate(recordId, {
      status: 'completed',
      responseStatus: statusCode ?? res.statusCode,
      responseBody: payload,
    });
  } catch (_) {}
}


