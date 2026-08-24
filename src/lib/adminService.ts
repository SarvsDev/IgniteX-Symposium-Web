import { Registration, AdminStats, VerificationResponse } from '../types';

async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { success: false, error: { code: 'INVALID_RESPONSE', message: text || `HTTP ${response.status}` } }; }
}

function adminHeaders(adminKey: string, json = false): HeadersInit {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    'x-admin-key': adminKey,
  };
}

export async function fetchAdminRegistrations(adminKey: string, statusFilter?: string): Promise<Registration[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
  const response = await fetch(`/api/admin/registrations${params.toString() ? `?${params}` : ''}`, { headers: adminHeaders(adminKey) });
  const data = await parseResponse(response);
  if (!response.ok || !data.success) throw new Error(data.error?.message || 'Failed to fetch registrations');
  return data.registrations || [];
}

export async function fetchAdminStats(adminKey: string): Promise<AdminStats | null> {
  const response = await fetch('/api/admin/stats', { headers: adminHeaders(adminKey) });
  const data = await parseResponse(response);
  if (!response.ok || !data.success) throw new Error(data.error?.message || 'Failed to fetch admin statistics');
  return data.stats || null;
}

export async function approveRegistration(registrationId: string, adminKey: string) {
  const response = await fetch('/api/admin/approve-registration', { method: 'POST', headers: adminHeaders(adminKey, true), body: JSON.stringify({ registration_id: registrationId }) });
  const data = await parseResponse(response);
  if (!response.ok || !data.success) return { success: false, message: data.error?.message || 'Approval failed' };
  return { success: true, message: data.data?.message || 'Registration approved', verification_code: data.data?.verification_code };
}

export async function rejectRegistration(registrationId: string, rejectionReason: string, adminKey: string) {
  const response = await fetch('/api/admin/reject-registration', { method: 'POST', headers: adminHeaders(adminKey, true), body: JSON.stringify({ registration_id: registrationId, rejection_reason: rejectionReason }) });
  const data = await parseResponse(response);
  if (!response.ok || !data.success) return { success: false, message: data.error?.message || 'Rejection failed' };
  return { success: true, message: data.data?.message || 'Registration rejected' };
}

export async function resendRegistrationEmail(registrationId: string, adminKey: string) {
  const response = await fetch('/api/admin/resend-email', { method: 'POST', headers: adminHeaders(adminKey, true), body: JSON.stringify({ registration_id: registrationId }) });
  const data = await parseResponse(response);
  return { success: response.ok && Boolean(data.success), message: data.data?.message || data.error?.message || 'Email operation failed' };
}

export async function verifyPassTicket(codeOrToken: string, adminKey?: string, confirmCheckin = false): Promise<VerificationResponse> {
  try {
    const response = await fetch('/api/attendance/verify', { method: 'POST', headers: adminHeaders(adminKey || '', true), body: JSON.stringify({ verification_code: codeOrToken, qr_token: codeOrToken, confirm_checkin: confirmCheckin, staff_email: 'admin@ignitex.edu' }) });
    const data = await parseResponse(response);
    return data;
  } catch (error: any) {
    return { valid: false, status: 'ERROR', message: error?.message || 'Verification failed.' };
  }
}

export interface ParticipantEventRow {
  registration_number: string;
  participant_name: string;
  event_name: string;
  registration_status: string;
  registered_at: string;
}

export async function fetchParticipantEventReport(adminKey: string): Promise<ParticipantEventRow[]> {
  const response = await fetch('/api/admin/participant-events', { headers: adminHeaders(adminKey) });
  const data = await parseResponse(response);
  if (!response.ok || !data.success) throw new Error(data.error?.message || 'Failed to fetch participant-event report');
  return data.rows || [];
}

export interface EventCountRow {
  event_id: string;
  registered_count: number;
  approved_count: number;
  checked_in_count: number;
  events?: { title?: string; slug?: string; max_capacity?: number };
}

export async function fetchEventRegistrationCounts(adminKey: string): Promise<EventCountRow[]> {
  const response = await fetch('/api/admin/event-counts', { headers: adminHeaders(adminKey) });
  const data = await parseResponse(response);
  if (!response.ok || !data.success) throw new Error(data.error?.message || 'Failed to fetch event counts');
  return data.counts || [];
}

export interface PaymentProofResponse {
  id: string;
  registration_id: string;
  registration_number: string;
  original_file_name?: string;
  mime_type: string;
  file_size_bytes: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploaded_at: string;
  signed_url: string;
  expires_in_seconds: number;
}

export async function fetchPaymentProof(registrationId: string, adminKey: string): Promise<PaymentProofResponse> {
  const response = await fetch(`/api/admin/payment-proof/${encodeURIComponent(registrationId)}`, { headers: adminHeaders(adminKey) });
  const data = await parseResponse(response);
  if (!response.ok || !data.success) throw new Error(data.error?.message || 'Failed to open payment proof');
  return data.proof;
}
