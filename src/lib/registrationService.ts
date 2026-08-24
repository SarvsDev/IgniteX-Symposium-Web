import { Registration, RegistrationSubmissionPayload } from '../types';

export interface RegistrationSubmitResult {
  success: boolean;
  data?: {
    registration_id: string;
    registration_number: string;
    status: string;
    payment_status: string;
    amount: number;
    receipt_number?: string;
    registrations?: Registration[];
    message?: string;
  };
  error?: { code: string; message: string };
}

async function parseResponse(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { success: false, error: { code: 'INVALID_SERVER_RESPONSE', message: text || 'Invalid server response.' } }; }
}

export async function submitRegistration(payload: RegistrationSubmissionPayload): Promise<RegistrationSubmitResult> {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseResponse(response);
    if (!response.ok || !data.success) return { success: false, error: data.error || { code: 'REGISTRATION_FAILED', message: data.message || `Request failed (${response.status}).` } };
    return data;
  } catch (error: any) {
    return { success: false, error: { code: 'NETWORK_ERROR', message: error?.message || 'Could not connect to the registration server.' } };
  }
}

export async function uploadPaymentProof(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  // The registration endpoint accepts the payment screenshot as a data URL.
  // Keep this helper for compatibility with existing UI components.
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ success: true, url: String(reader.result) });
    reader.onerror = () => resolve({ success: false, error: 'Could not read payment screenshot.' });
    reader.readAsDataURL(file);
  });
}
