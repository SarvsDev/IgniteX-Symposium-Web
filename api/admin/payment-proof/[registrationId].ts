import { handleAdminRoute } from '../../../lib/adminApi.js';

export default function handler(req: any, res: any) {
  const id = Array.isArray(req.query?.registrationId) ? req.query.registrationId[0] : String(req.query?.registrationId || '');
  return handleAdminRoute(req, res, `payment-proof/${id}`);
}
