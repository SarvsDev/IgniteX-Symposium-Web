// Consolidated root API catch-all.
// Keeping all root API endpoints behind one Vercel function avoids the Hobby
// plan's serverless-function limit while preserving the existing handlers.
import registerHandler, { maxDuration as registerMaxDuration } from './register.js';
import verifyTicketHandler from './verify-ticket.js';
import attendanceVerifyHandler from './attendance/verify.js';
import healthHandler from './health.js';
import configStatusHandler from './config-status.js';
import dbTestHandler from './db-test.js';

export const maxDuration = registerMaxDuration || 60;

type VercelRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
  send(body: unknown): VercelResponse;
  setHeader(name: string, value: string | number | readonly string[]): VercelResponse;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawPath = Array.isArray(req.query?.path)
    ? req.query.path.join('/')
    : String(req.query?.path || '');
  const path = rawPath.replace(/^\/+|\/+$/g, '');

  switch (path) {
    case 'register':
      return registerHandler(req, res);
    case 'verify-ticket':
      return verifyTicketHandler(req, res);
    case 'attendance/verify':
      return attendanceVerifyHandler(req, res);
    case 'health':
      return healthHandler(req, res);
    case 'config-status':
      return configStatusHandler(req, res);
    case 'db-test':
      return dbTestHandler(req, res);
    default:
      return res.status(404).json({
        success: false,
        error: {
          code: 'API_ROUTE_NOT_FOUND',
          message: `API route not found: /api/${path}`,
        },
      });
  }
}
