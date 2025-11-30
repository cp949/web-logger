// Type-only assertions for WebLogger generics and metadata typing.

import type { WebLogger } from './WebLogger';

type UserMeta = { userId: string; email?: string };

declare const typedLogger: WebLogger<UserMeta>;

typedLogger.info('ok', { userId: 'u1' });

// @ts-expect-error email must be string | undefined
typedLogger.info('wrong', { userId: 'u2', email: 123 });

// @ts-expect-error missing userId
typedLogger.info('missing', { email: 'a@b.com' });

export {};
