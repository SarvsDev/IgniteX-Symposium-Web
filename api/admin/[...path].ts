import app from '../../server';

/**
 * Explicit Vercel catch-all for /api/admin/*.
 *
 * Vercel can route nested API paths differently depending on the build
 * configuration. Keeping an explicit admin catch-all prevents requests such
 * as /api/admin/auth from falling through to the SPA and returning HTML/404.
 */
export default async function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Admin API]', error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'ADMIN_API_RUNTIME_ERROR',
          message: error?.message || 'Admin API runtime error.',
        },
      });
    }
  }
}
