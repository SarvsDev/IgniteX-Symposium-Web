import app from '../server';

export default async function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel API]', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'VERCEL_API_RUNTIME_ERROR',
          message: error?.message || 'API runtime error.',
        },
      });
    }
  }
}
