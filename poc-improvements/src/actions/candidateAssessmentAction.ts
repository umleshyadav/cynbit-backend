import { z } from 'zod';
import { createSafeAction } from '../lib/actionWrapper.ts';
import { verifySignedCandidateToken } from '../lib/authTokens.ts';

export const AssessmentSubmissionSchema = z.object({
  candidateSessionToken: z
    .string()
    .min(10, 'Session token is missing or malformed'),
  githubUrl: z
    .string()
    .trim()
    .url('Please provide a valid URL')
    .regex(
      /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_\-\.]+\/[a-zA-Z0-9_\-\.]+.*$/,
      'Must be a valid public GitHub repository URL (e.g. https://github.com/user/repo)'
    ),
  additionalLinks: z
    .array(z.string().url('Additional resource must be a valid URL'))
    .max(5, 'Maximum of 5 additional links allowed')
    .default([]),
  technicalNotes: z
    .string()
    .trim()
    .max(5000, 'Technical notes cannot exceed 5000 characters')
    .default('')
});

export type AssessmentSubmissionInput = z.infer<typeof AssessmentSubmissionSchema>;

/**
 * Secure replacement for submitCandidateAssessment (ID: 7802063608b388984f56bb777157f0fc53817e503d)
 * Enforces cryptographic session verification, strict URL syntax, and rate limits.
 */
export const submitCandidateAssessment = createSafeAction(
  {
    schema: AssessmentSubmissionSchema,
    rateLimitKey: 'submit-assessment',
    maxRequests: 5,
    windowSeconds: 120
  },
  async (input, { clientIp }) => {
    // 1. Authenticate candidate via signed token
    const candidateSession = verifySignedCandidateToken(input.candidateSessionToken);
    if (!candidateSession) {
      throw new Error('Authentication expired or invalid. Please re-open your candidate link.');
    }

    // 2. Persist assessment submission in database
    // await prisma.candidateAssessment.upsert({
    //   where: { candidateId: candidateSession.candidateId },
    //   update: {
    //     githubUrl: input.githubUrl,
    //     additionalLinks: input.additionalLinks,
    //     technicalNotes: input.technicalNotes,
    //     updatedAt: new Date()
    //   },
    //   create: {
    //     candidateId: candidateSession.candidateId,
    //     githubUrl: input.githubUrl,
    //     additionalLinks: input.additionalLinks,
    //     technicalNotes: input.technicalNotes
    //   }
    // });

    return {
      candidateId: candidateSession.candidateId,
      submissionStatus: 'RECEIVED',
      githubUrl: input.githubUrl,
      timestamp: new Date().toISOString()
    };
  }
);
