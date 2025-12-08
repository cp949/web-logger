import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  WebLogger,
  addSensitiveKey,
  getSensitiveKeys,
  removeSensitiveKey,
  resetSensitiveKeys,
} from '../../src/WebLogger';
import { cleanupTestEnvironment, createConsoleSpy, setupTestEnvironment } from '../test-helpers';

describe('SensitiveKeysManager', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('addSensitiveKey', () => {
    it('새로운 민감 키를 추가해야 함', () => {
      addSensitiveKey('customSecret');
      const keys = getSensitiveKeys();
      expect(keys).toContain('customsecret'); // 소문자로 저장됨
    });

    it('대소문자 구분 없이 추가해야 함', () => {
      addSensitiveKey('MyCustomKey');
      const keys = getSensitiveKeys();
      expect(keys).toContain('mycustomkey');
    });
  });

  describe('removeSensitiveKey', () => {
    it('기본 키를 제거할 수 있어야 함', () => {
      const initialKeys = getSensitiveKeys();
      expect(initialKeys).toContain('email');

      removeSensitiveKey('email');
      const keys = getSensitiveKeys();
      expect(keys).not.toContain('email');
    });

    it('대소문자 구분 없이 제거해야 함', () => {
      removeSensitiveKey('EMAIL');
      const keys = getSensitiveKeys();
      expect(keys).not.toContain('email');
    });
  });

  describe('getSensitiveKeys', () => {
    it('현재 민감 키 목록을 반환해야 함', () => {
      const keys = getSensitiveKeys();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('정렬된 배열을 반환해야 함', () => {
      const keys = getSensitiveKeys();
      const sorted = [...keys].sort();
      expect(keys).toEqual(sorted);
    });
  });

  describe('resetSensitiveKeys', () => {
    it('기본 키 목록으로 초기화해야 함', () => {
      addSensitiveKey('customKey');
      expect(getSensitiveKeys()).toContain('customkey');

      resetSensitiveKeys();
      expect(getSensitiveKeys()).not.toContain('customkey');
    });
  });

  describe('키 기반 마스킹 동작', () => {
    it('생성 시 민감 키를 교체할 수 있어야 함', () => {
      const consoleSpy = createConsoleSpy();

      // 기본 키 목록을 제거하고 custom만 추가
      resetSensitiveKeys();
      addSensitiveKey('custom');
      // password 키 제거
      removeSensitiveKey('password');

      const customLogger = new WebLogger({
        prefix: '[Opt]',
        enableMasking: true,
      });
      customLogger.setLogLevel('debug');

      const payload = { custom: 'secret', password: 'visible' };
      customLogger.info('payload', payload);

      expect(consoleSpy.table).toHaveBeenCalled();
      const tableData = consoleSpy.table.mock.calls[0][0] as any;
      // custom은 마스킹되고, password는 제거되었으므로 마스킹되지 않음
      expect(tableData.custom).toBe('se***');
      expect(tableData.password).toBe('visible');
    });
  });
});
