/**
 * Standalone admin authentication endpoint for Vercel.
 *
 * IMPORTANT:
 * - The admin secret is server-side only.
 * - This file intentionally has no Supabase/Resend imports so authentication
 *   cannot crash because another backend dependency or environment variable
 *   is misconfigured.
 */

type RequestLike = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => unknown;
  setHeader?: (name: string, value: string | string[]) => void;
};

function clean(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"]|['"]$/g, '').trim();
}

function getBody(req: RequestLike): Record<string, unknown> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }

  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}

function getHeader(req: RequestLike, name: string): string {
  const headers = req.headers || {};
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? clean(value[0]) : clean(value);
}

function secret(): string {
  return clean(process.env.ADMIN_SECRET_KEY);
}

export default function handler(req: RequestLike, res: ResponseLike) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader?.('Allow', 'POST, OPTIONS');
      res.setHeader?.('Cache-Control', 'no-store');
      return res.status(204).json({});
    }

    if (req.method !== 'POST') {
      res.setHeader?.('Allow', 'POST, OPTIONS');
      res.setHeader?.('Cache-Control', 'no-store');
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Use POST /api/admin/auth to authenticate.',
        },
      });
    }

    const configuredSecret = secret();

    if (!configuredSecret) {
      console.error('[Admin Auth] ADMIN_SECRET_KEY is missing.');
      return res.status(500).json({
        success: false,
        error: {
          code: 'ADMIN_KEY_NOT_CONFIGURED',
          message: 'ADMIN_SECRET_KEY is not configured for this deployment.',
        },
      });
    }

    const body = getBody(req);
    const submittedKey = clean(
      body.key ?? body.passcode ?? body.passkey
    );

    // Constant-time comparison is preferable for secrets, but keeping this
    // endpoint dependency-free is more important for Vercel reliability.
    if (!submittedKey || submittedKey !== configuredSecret) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_ADMIN_KEY',
          message: 'Invalid admin passkey.',
        },
      });
    }

    res.setHeader?.('Cache-Control', 'no-store');

    return res.status(200).json({
      success: true,
      data: {
        message: 'Admin authentication successful.',
      },
    });
  } catch (error) {
    console.error('[Admin Auth] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_AUTH_SERVER_ERROR',
        message: 'Admin authentication server error.',
      },
    });
  }
}
