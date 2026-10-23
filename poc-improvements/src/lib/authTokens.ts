import crypto from 'crypto';

const SECRET_KEY = process.env.CANDIDATE_TOKEN_SECRET || 'cynbit-secure-default-key-minimum-32-chars';

export interface CandidateTokenPayload {
  candidateId: string;
  email: string;
  role: string;
  exp: number; // Unix timestamp (seconds)
}

/**
 * Generates an HMAC-SHA256 tamper-evident candidate session token.
 * Replaces raw cleartext database CUIDs in URLs.
 */
export function generateSignedCandidateToken(
  candidateId: string,
  email: string,
  role = 'CANDIDATE',
  validityDays = 7
): string {
  const payload: CandidateTokenPayload = {
    candidateId,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + validityDays * 86400
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Validates token signature and expiration.
 * Constant-time comparison ensures resistance to timing attacks.
 */
export function verifySignedCandidateToken(tokenString: string): CandidateTokenPayload | null {
  try {
    const parts = tokenString.split('.');
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(encodedPayload)
      .digest('base64url');

    // Constant-time comparison to prevent side-channel timing attacks
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null; // Tampered token
    }

    const payload: CandidateTokenPayload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf-8')
    );

    // Expiration verification
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp > payload.exp) {
      return null; // Token expired
    }

    return payload;
  } catch {
    return null;
  }
}
