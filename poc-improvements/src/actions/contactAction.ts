import { z } from 'zod';
import { createSafeAction } from '../lib/actionWrapper.ts';

export const ContactInquirySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid business or personal email address')
    .toLowerCase(),
  company: z
    .string()
    .trim()
    .max(100)
    .optional(),
  serviceCategory: z.enum([
    'AI_AUTOMATION',
    'SOFTWARE_SOLUTIONS',
    'AUTONOMOUS_AGENTS',
    'HIGH_PERFORMANCE_LABS',
    'GENERAL_INQUIRY'
  ]),
  message: z
    .string()
    .trim()
    .min(10, 'Inquiry message must contain at least 10 characters')
    .max(3000, 'Message cannot exceed 3000 characters')
});

export type ContactInquiryInput = z.infer<typeof ContactInquirySchema>;

/**
 * Secure, rate-limited replacement for submitInquiry (ID: 40abb1a98c0be9294b518c6ca84ffcc8f63f3a5849)
 */
export const submitInquiry = createSafeAction(
  {
    schema: ContactInquirySchema,
    rateLimitKey: 'submit-inquiry',
    maxRequests: 3,
    windowSeconds: 60
  },
  async (validatedData, { clientIp }) => {
    // Simulated persistence & async notification dispatch
    const inquiryRecord = {
      id: `inq_${Date.now()}`,
      ...validatedData,
      sourceIp: clientIp,
      status: 'RECEIVED',
      createdAt: new Date().toISOString()
    };

    // Return sanitized confirmation for client feedback
    return {
      inquiryId: inquiryRecord.id,
      submittedAt: inquiryRecord.createdAt
    };
  }
);
