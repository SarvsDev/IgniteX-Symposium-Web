import { handleAdminRoute } from '../../lib/adminApi.js';

export default function handler(req: any, res: any) {
  return handleAdminRoute(req, res, 'stats');
}
