import { handleAdminRoute } from '../../lib/adminApi';

export default function handler(req: any, res: any) {
  return handleAdminRoute(req, res, 'auth');
}
