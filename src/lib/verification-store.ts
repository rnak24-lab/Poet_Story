// In-memory verification code store
// Works for single-instance deployment (Vercel serverless may need Redis for multi-instance)

const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export function getStoredCode(email: string): string | null {
  const entry = verificationCodes.get(email);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    verificationCodes.delete(email);
    return null;
  }
  return entry.code;
}

export function setStoredCode(email: string, code: string) {
  verificationCodes.set(email, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10분
  });
}

export function deleteStoredCode(email: string) {
  verificationCodes.delete(email);
}
