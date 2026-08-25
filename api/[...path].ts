import app from '../server';

// Explicit Vercel serverless handler.
// Exporting the Express application directly can produce a platform-level
// 500/non-JSON response in some Vercel Node runtimes. Calling it explicitly
// keeps the response contract consistent for every /api/* endpoint.
export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel API handler]', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'VERCEL_API_HANDLER_FAILED',
          message: error?.message || 'API handler failed.',
        },
      });
    }
  }
}
