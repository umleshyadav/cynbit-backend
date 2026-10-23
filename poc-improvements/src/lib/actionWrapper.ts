import { z } from 'zod';
import { checkRateLimit } from './rateLimit.ts';

export type ActionResult<TData> =
  | { success: true; data: TData; error?: never; fieldErrors?: never }
  | { success: false; error: string; fieldErrors?: Record<string, string[]>; data?: never };

export interface SafeActionOptions<TSchema extends z.ZodTypeAny> {
  schema: TSchema;
  rateLimitKey: string;
  maxRequests?: number;
  windowSeconds?: number;
}

export interface ActionContext {
  clientIp: string;
}

/**
 * Creates a type-safe Server Action wrapper that validates input using Zod,
 * applies sliding-window rate limiting, and returns a predictable result envelope.
 */
export function createSafeAction<TSchema extends z.ZodTypeAny, TOutput>(
  options: SafeActionOptions<TSchema>,
  handler: (parsedInput: z.infer<TSchema>, context: ActionContext) => Promise<TOutput>
) {
  return async (
    rawInput: unknown,
    providedIp = '127.0.0.1'
  ): Promise<ActionResult<TOutput>> => {
    try {
      // 1. Sliding Window Rate Limiting
      const isAllowed = await checkRateLimit({
        key: `${options.rateLimitKey}:${providedIp}`,
        limit: options.maxRequests ?? 5,
        windowSecs: options.windowSeconds ?? 60
      });

      if (!isAllowed) {
        return {
          success: false,
          error: 'Rate limit exceeded. Too many requests. Please wait before retrying.'
        };
      }

      // 2. Normalize input if supplied as FormData
      let payload = rawInput;
      if (rawInput && typeof rawInput === 'object' && 'entries' in rawInput && typeof (rawInput as any).entries === 'function') {
        const formData = rawInput as any;
        const normalized: Record<string, any> = {};
        for (const [k, v] of formData.entries()) {
          normalized[k] = v;
        }
        payload = normalized;
      }

      // 3. Schema Parsing & Coercion via Zod
      const parseResult = options.schema.safeParse(payload);
      if (!parseResult.success) {
        return {
          success: false,
          error: 'Validation failed. Please verify the submitted information.',
          fieldErrors: parseResult.error.flatten().fieldErrors
        };
      }

      // 4. Delegate to business logic handler
      const output = await handler(parseResult.data, { clientIp: providedIp });
      return { success: true, data: output };

    } catch (err: any) {
      console.error(`[ServerAction Exception] ${options.rateLimitKey}:`, err);
      return {
        success: false,
        error: err.message || 'An unexpected internal server error occurred.'
      };
    }
  };
}
