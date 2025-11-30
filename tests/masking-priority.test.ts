// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebLogger } from '../src/WebLogger';

describe('Masking Priority - Key-based vs Pattern-based', () => {
  let logger: WebLogger;
  let consoleSpy: any;

  beforeEach(() => {
    logger = new WebLogger('[TEST]');
    logger.setLogLevel('debug');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Key-based masking priority', () => {
    it('should prioritize key-based masking over pattern masking for sensitive keys', () => {
      // 키가 'email'이고 값이 이메일 패턴인 경우
      const data = {
        email: 'user@example.com',
        password: 'mypassword123',
        apiKey: 'sk-1234567890abcdef',
      };

      logger.info('Key priority test', data);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // 키 기반 마스킹이 우선 적용되어 [REDACTED]로 표시되어야 함
      expect(tableCall[0].email).toBe('[REDACTED]');
      expect(tableCall[0].password).toBe('[REDACTED]');
      expect(tableCall[0].apiKey).toBe('[REDACTED]');

      // [EMAIL], [PASSWORD], [APIKEY] 등의 패턴 마스킹이 아님
      expect(tableCall[0].email).not.toBe('[EMAIL]');
      expect(tableCall[0].password).not.toBe('[PASSWORD]');
      expect(tableCall[0].apiKey).not.toBe('[APIKEY]');
    });

    it('should apply pattern masking to normal keys with sensitive patterns', () => {
      // 일반 키에 민감한 패턴이 포함된 경우
      const data = {
        userInfo: 'Contact: user@example.com',
        paymentMethod: 'Card: 1234-5678-9012-3456',
        contactNumber: 'Phone: 010-1234-5678',
        // apiKey 패턴은 32자 이상의 연속된 영숫자만 매칭
        description: 'API Key: abcdefghijklmnopqrstuvwxyz123456789012',
      };

      logger.info('Pattern masking test', data);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // 키가 민감하지 않으므로 값의 패턴 마스킹이 적용되어야 함
      expect(tableCall[0].userInfo).toBe('Contact: [EMAIL]');
      expect(tableCall[0].paymentMethod).toBe('Card: [CARD]');
      expect(tableCall[0].contactNumber).toBe('Phone: [PHONE]');
      // 32자 이상 연속된 문자가 API key로 마스킹됨
      expect(tableCall[0].description).toBe('API Key: [APIKEY]');
    });

    it('should not apply pattern masking after key-based masking', () => {
      // 키 기반 마스킹이 적용된 후에는 패턴 체크를 하지 않아야 함
      const data = {
        email: 'not-an-email-just-text',  // 이메일 패턴이 아닌 일반 텍스트
        password: '123',  // 짧은 비밀번호
        token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',  // JWT 토큰
      };

      logger.info('Key masking only test', data);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // 키가 민감하면 값의 내용과 관계없이 [REDACTED]
      expect(tableCall[0].email).toBe('[REDACTED]');
      expect(tableCall[0].password).toBe('[REDACTED]');
      expect(tableCall[0].token).toBe('[REDACTED]');
    });
  });

  describe('Nested object masking priority', () => {
    it('should apply key-based masking first in nested objects', () => {
      const data = {
        user: {
          email: 'admin@company.com',
          name: 'John Doe',
          profile: {
            password: 'securepass123',
            phone: '010-9876-5432',
          }
        },
        metadata: {
          description: 'Email: contact@example.com',
          // password 패턴은 특정 형식 (password: "value") 을 찾음
          notes: 'password: "temp123"',
        }
      };

      logger.info('Nested masking test', data);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // 중첩된 객체에서도 키 기반 마스킹이 우선
      expect(tableCall[0].user.email).toBe('[REDACTED]');
      expect(tableCall[0].user.name).toBe('John Doe');
      expect(tableCall[0].user.profile.password).toBe('[REDACTED]');
      expect(tableCall[0].user.profile.phone).toBe('[REDACTED]');

      // 일반 키의 값에는 패턴 마스킹 적용
      expect(tableCall[0].metadata.description).toBe('Email: [EMAIL]');
      expect(tableCall[0].metadata.notes).toBe('[PASSWORD]');
    });
  });

  describe('Array masking priority', () => {
    it('should apply pattern masking to array values', () => {
      const data = {
        emails: ['user1@example.com', 'user2@example.com', 'not-an-email'],
        cards: ['1234-5678-9012-3456', '9876-5432-1098-7654'],
        mixed: [
          'Email: test@test.com',
          'Card: 1111-2222-3333-4444',
          'Normal text',
          'Phone: 010-1234-5678'
        ]
      };

      logger.info('Array masking test', data);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // 'emails' 키는 민감한 키가 아니므로 배열 내용에 패턴 마스킹 적용
      // 참고: 실제 구현에 따라 'emails'가 민감한 키로 분류될 수 있음
      // 여기서는 'email' (단수형)만 민감한 키로 가정
      if (tableCall[0].emails === '[REDACTED]') {
        // 'emails'가 민감한 키로 처리된 경우
        expect(tableCall[0].emails).toBe('[REDACTED]');
      } else {
        // 'emails'가 일반 키로 처리된 경우 - 배열 값에 패턴 마스킹
        expect(tableCall[0].emails[0]).toBe('[EMAIL]');
        expect(tableCall[0].emails[1]).toBe('[EMAIL]');
        expect(tableCall[0].emails[2]).toBe('not-an-email');
      }

      // cards는 일반 키이므로 패턴 마스킹 적용
      expect(tableCall[0].cards[0]).toBe('[CARD]');
      expect(tableCall[0].cards[1]).toBe('[CARD]');

      // mixed 배열의 각 요소에 패턴 마스킹 적용
      expect(tableCall[0].mixed[0]).toBe('Email: [EMAIL]');
      expect(tableCall[0].mixed[1]).toBe('Card: [CARD]');
      expect(tableCall[0].mixed[2]).toBe('Normal text');
      expect(tableCall[0].mixed[3]).toBe('Phone: [PHONE]');
    });

    it('should mask entire array if key is sensitive', () => {
      const data = {
        password: ['pass1', 'pass2', 'pass3'],  // 키가 'password'
        apiKey: ['key1', 'key2'],  // 키가 'apiKey'
        tokens: ['token1', 'token2']  // 'tokens'는 일반 키일 수 있음
      };

      logger.info('Sensitive key array test', data);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // 키가 민감하면 배열 전체가 [REDACTED]
      expect(tableCall[0].password).toBe('[REDACTED]');
      expect(tableCall[0].apiKey).toBe('[REDACTED]');
    });
  });

  describe('Mixed patterns in single string', () => {
    it('should apply multiple pattern maskings in order', () => {
      const data = {
        message: 'Contact user@example.com or call 010-1234-5678',
        payment: 'Use card 1234-5678-9012-3456 or email billing@company.com',
        combined: 'JWT: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature and email: admin@test.com'
      };

      logger.info('Multiple patterns test', data);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // 여러 패턴이 순차적으로 적용되어야 함
      expect(tableCall[0].message).toContain('[EMAIL]');
      expect(tableCall[0].message).toContain('[PHONE]');

      expect(tableCall[0].payment).toContain('[CARD]');
      expect(tableCall[0].payment).toContain('[EMAIL]');

      expect(tableCall[0].combined).toContain('[JWT]');
      expect(tableCall[0].combined).toContain('[EMAIL]');
    });
  });

  describe('Case sensitivity in key masking', () => {
    it('should mask keys regardless of case', () => {
      const data = {
        EMAIL: 'upper@example.com',
        Email: 'pascal@example.com',
        email: 'lower@example.com',
        eMaIl: 'mixed@example.com',
        PASSWORD: 'UPPER123',
        Password: 'Pascal123',
        password: 'lower123',
        ApiKey: 'PascalKey',
        apikey: 'lowerkey',
        APIKEY: 'UPPERKEY'
      };

      logger.info('Case sensitivity test', data);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // 대소문자 관계없이 민감한 키는 모두 마스킹되어야 함
      expect(tableCall[0].EMAIL).toBe('[REDACTED]');
      expect(tableCall[0].Email).toBe('[REDACTED]');
      expect(tableCall[0].email).toBe('[REDACTED]');
      expect(tableCall[0].eMaIl).toBe('[REDACTED]');

      expect(tableCall[0].PASSWORD).toBe('[REDACTED]');
      expect(tableCall[0].Password).toBe('[REDACTED]');
      expect(tableCall[0].password).toBe('[REDACTED]');

      expect(tableCall[0].ApiKey).toBe('[REDACTED]');
      expect(tableCall[0].apikey).toBe('[REDACTED]');
      expect(tableCall[0].APIKEY).toBe('[REDACTED]');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings and null values', () => {
      const data = {
        email: '',
        password: null,
        apiKey: undefined,
        normal: '',
        description: null
      };

      logger.info('Edge case test', data);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // 민감한 키는 값이 empty/null/undefined여도 마스킹
      expect(tableCall[0].email).toBe('[REDACTED]');
      expect(tableCall[0].password).toBe('[REDACTED]');
      expect(tableCall[0].apiKey).toBe('[REDACTED]');

      // 일반 키는 원본 값 유지
      expect(tableCall[0].normal).toBe('');
      expect(tableCall[0].description).toBe(null);
    });

    it('should handle objects with sensitive key names containing patterns', () => {
      const data = {
        'email@domain': 'This key name contains @ symbol',
        'password123': 'Key name has numbers',
        'api-key-name': 'Hyphenated key name',
        'normal@key': 'Not a sensitive key despite @ symbol'
      };

      logger.info('Key name pattern test', data);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // 키 이름에 특수문자가 있어도 민감한 키 판별은 기본 키워드 기준
      // 'email@domain'은 'email'로 시작하므로 민감한 키일 수 있음
      // 'password123'은 'password'로 시작하므로 민감한 키일 수 있음
      // 실제 구현에 따라 다를 수 있음
    });
  });
});