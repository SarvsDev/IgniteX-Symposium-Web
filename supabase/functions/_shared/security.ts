// Secure Verification Code & Token Generation Utilities

/**
 * Generate a cryptographically secure, unpredictable verification code
 * Format: ZHS-2026-8F4K9Q or IGN-7K4P-X92M
 */
export function generateVerificationCode(prefix: string = 'IGN'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 avoiding ambiguous 0,O,1,I
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[randomBytes[i] % chars.length];
  }
  for (let i = 4; i < 8; i++) {
    part2 += chars[randomBytes[i] % chars.length];
  }
  
  return `${prefix}-${part1}-${part2}`;
}

/**
 * Generate an opaque, cryptographically secure QR token
 */
export function generateOpaqueQRToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
