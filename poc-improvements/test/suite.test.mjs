import test from 'node:test';
import assert from 'node:assert/strict';

import { checkRateLimit } from '../src/lib/rateLimit.ts';
import { generateSignedCandidateToken, verifySignedCandidateToken } from '../src/lib/authTokens.ts';
import { submitInquiry, ContactInquirySchema } from '../src/actions/contactAction.ts';

test('1. Rate Limiter - Sliding Window Enforcement', async () => {
  const key = 'test-ip-client-1';
  const limit = 3;
  const windowSecs = 1;

  assert.equal(await checkRateLimit({ key, limit, windowSecs }), true, '1st request should pass');
  assert.equal(await checkRateLimit({ key, limit, windowSecs }), true, '2nd request should pass');
  assert.equal(await checkRateLimit({ key, limit, windowSecs }), true, '3rd request should pass');
  assert.equal(await checkRateLimit({ key, limit, windowSecs }), false, '4th request must be throttled');
});

test('2. Candidate Session Token - Generation, Verification & Tamper Resistance', () => {
  const candidateId = 'cmsqg4pyr000004l0ua8myhsu';
  const email = 'candidate@cynbit.test';

  const token = generateSignedCandidateToken(candidateId, email, 'CANDIDATE', 7);
  assert.ok(token.includes('.'), 'Token must be composed of payload.signature');

  // Verify valid token
  const payload = verifySignedCandidateToken(token);
  assert.ok(payload !== null, 'Valid token must successfully verify');
  assert.equal(payload.candidateId, candidateId);
  assert.equal(payload.email, email);

  // Tamper with token payload
  const [encPayload, sig] = token.split('.');
  const tamperedPayload = encPayload + 'xyz';
  assert.equal(verifySignedCandidateToken(`${tamperedPayload}.${sig}`), null, 'Tampered token must be rejected');

  // Tamper with signature
  assert.equal(verifySignedCandidateToken(`${encPayload}.invalidsignature`), null, 'Invalid signature must be rejected');
});

test('3. Server Action Wrapper - Schema Validation Contract', async () => {
  // Test invalid payload
  const invalidResult = await submitInquiry({
    fullName: 'A', // Too short (min 2)
    email: 'not-an-email',
    serviceCategory: 'INVALID_CATEGORY',
    message: 'short'
  }, '10.0.0.1');

  assert.equal(invalidResult.success, false, 'Invalid data must fail validation');
  assert.ok(invalidResult.fieldErrors, 'Field errors must be populated');
  assert.ok(invalidResult.fieldErrors.fullName);
  assert.ok(invalidResult.fieldErrors.email);
  assert.ok(invalidResult.fieldErrors.serviceCategory);

  // Test valid payload
  const validResult = await submitInquiry({
    fullName: 'Alex Rivera',
    email: 'alex@enterprise.com',
    company: 'Enterprise AI Corp',
    serviceCategory: 'AI_AUTOMATION',
    message: 'We are seeking architectural guidance on autonomous agent deployment.'
  }, '10.0.0.2');

  assert.equal(validResult.success, true, 'Valid payload must succeed');
  assert.ok(validResult.data.inquiryId, 'Must return inquiry identifier');
});
