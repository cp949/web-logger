/**
 * Quick demo script for sensitive patterns, warnings, and typed metadata.
 *
 * Run with: pnpm ts-node packages/web-logger/scripts/demo.ts
 * (ts-node 또는 tsx 등 TS 런타임이 설치되어 있어야 합니다)
 */

import { WebLogger, addSensitivePatterns, setSensitivePatternWarnings, setSensitivePatterns } from '../src/WebLogger';

type UserMeta = { userId: string; email?: string };

const logger = new WebLogger<UserMeta>('[Demo]');

// Default masking
logger.info('Default patterns', { userId: 'u1', email: 'user@example.com' });

// Merge without losing defaults
addSensitivePatterns({ ticket: /TICKET-\d+/g });
logger.info('Ticket masked', { userId: 'u2', email: 'a@b.com' });
logger.debug('Ticket value', 'TICKET-123');

// Replace defaults (warnings shown)
setSensitivePatterns({ ticket: /TICKET-\d+/g });
logger.debug('Email now visible', 'user@example.com');

// Suppress warnings when intentionally replacing defaults
setSensitivePatternWarnings(true);
setSensitivePatterns({ ticket: /TICKET-\d+/g });
setSensitivePatternWarnings(false);
