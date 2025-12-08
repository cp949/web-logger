import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebLogger } from '../../src/WebLogger';
import { cleanupTestEnvironment, createConsoleSpy, setupTestEnvironment } from '../test-helpers';

describe('LogLevelManager', () => {
  let logger1: WebLogger;
  let logger2: WebLogger;
  let consoleSpy: ReturnType<typeof createConsoleSpy>;

  beforeEach(() => {
    setupTestEnvironment();
    consoleSpy = createConsoleSpy();
    logger1 = new WebLogger({ prefix: '[Test1]', enableMasking: true });
    logger2 = new WebLogger({ prefix: '[Test2]', enableMasking: true });
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('setLogLevel', () => {
    it('로그 레벨이 즉시 반영되어야 함', () => {
      logger1.setLogLevel('warn');
      logger1.debug('Should not appear');
      logger1.info('Should not appear');
      logger1.warn('Should appear');
      logger1.error('Should appear');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('로그 레벨이 none일 때 아무것도 출력하지 않아야 함', () => {
      logger1.setLogLevel('none');

      logger1.debug('Should not appear');
      logger1.info('Should not appear');
      logger1.warn('Should not appear');
      logger1.error('Should not appear');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('여러 인스턴스 공유', () => {
    it('여러 인스턴스가 동일한 로그 레벨을 공유해야 함', () => {
      logger1.setLogLevel('warn');
      expect(logger2.currentLogLevel).toBe('warn');

      logger2.setLogLevel('debug');
      expect(logger1.currentLogLevel).toBe('debug');
    });

    it('currentLogLevel getter가 동적으로 변경된 레벨을 반환해야 함', () => {
      logger1.setLogLevel('info');
      expect(logger1.currentLogLevel).toBe('info');

      logger1.setLogLevel('error');
      expect(logger1.currentLogLevel).toBe('error');
    });
  });

  describe('isEnabled', () => {
    it('로그 레벨이 none이 아닐 때 true를 반환해야 함', () => {
      logger1.setLogLevel('debug');
      expect(logger1.isEnabled).toBe(true);

      logger1.setLogLevel('info');
      expect(logger1.isEnabled).toBe(true);
    });

    it('로그 레벨이 none일 때 false를 반환해야 함', () => {
      logger1.setLogLevel('none');
      expect(logger1.isEnabled).toBe(false);
    });
  });
});
