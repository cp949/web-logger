// Type-only assertions for WebLogger generics and metadata typing.
// Note: WebLogger accepts TMetadata | unknown for console.log compatibility,
// so type errors are not enforced at compile time for metadata parameters.

import type { WebLogger } from '../src/WebLogger';

type UserMeta = { userId: string; email?: string };

declare const typedLogger: WebLogger<UserMeta>;

// Valid usage with correct metadata
typedLogger.info('ok', { userId: 'u1' });

// These would be runtime validation errors, but not compile-time errors
// due to the flexible signature for console.log compatibility
typedLogger.info('wrong', { userId: 'u2', email: 123 });
typedLogger.info('missing', { email: 'a@b.com' });

export {};
