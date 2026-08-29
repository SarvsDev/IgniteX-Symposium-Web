// Consolidated admin API catch-all.
// All existing admin routes are dispatched through the same implementation
// used by the individual admin route wrappers, reducing Vercel functions to one.
import { handleAdminRoute } from '../../lib/adminApi.js';

type VercelRequest = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type VercelResponse = any;

export default function handler(req: VercelRequest, res: VercelResponse) {
  const rawPath = Array.isArray(req.query?.path)
    ? req.query.path.join('/')
    : String(req.query?.path || '');
  const path = rawPath.replace(/^\/+|\/+$/g, '');
  return handleAdminRoute(req, res, path);
}
