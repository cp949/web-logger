import { clearSanitizeCache } from '../cache';
import { DEFAULT_SENSITIVE_PATTERNS } from '../constants';
import type { SensitivePatternMap } from '../types';

/**
 * 전역 민감 패턴 관리자 (싱글톤)
 */
export class SensitivePatternsManager {
  private static instance: SensitivePatternsManager;
  private patterns: SensitivePatternMap;
  private suppressWarnings = false;

  private constructor() {
    this.patterns = { ...DEFAULT_SENSITIVE_PATTERNS };
  }

  static getInstance(): SensitivePatternsManager {
    if (!SensitivePatternsManager.instance) {
      SensitivePatternsManager.instance = new SensitivePatternsManager();
    }
    return SensitivePatternsManager.instance;
  }

  getPatterns(): SensitivePatternMap {
    return this.patterns;
  }

  /**
   * 민감 패턴 전체를 교체
   */
  setPatterns(patterns: SensitivePatternMap): void {
    const normalized = this.normalizePatterns(patterns);
    this.warnIfDefaultsMissing(normalized);
    this.patterns = normalized;
    clearSanitizeCache();
  }

  /**
   * 민감 패턴 병합 (기존 + 추가/교체)
   */
  mergePatterns(patterns: SensitivePatternMap): void {
    const normalized = this.normalizePatterns(patterns);
    this.patterns = { ...this.patterns, ...normalized };
    clearSanitizeCache();
  }

  reset(): void {
    this.patterns = { ...DEFAULT_SENSITIVE_PATTERNS };
    clearSanitizeCache();
  }

  private normalizePatterns(patterns: SensitivePatternMap): SensitivePatternMap {
    const normalized: SensitivePatternMap = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern instanceof RegExp) {
        normalized[key] = pattern;
      }
    }
    return normalized;
  }

  private warnIfDefaultsMissing(nextPatterns: SensitivePatternMap): void {
    const missing = Object.keys(DEFAULT_SENSITIVE_PATTERNS).filter(
      (key) => !Object.prototype.hasOwnProperty.call(nextPatterns, key),
    );

    if (
      !this.suppressWarnings &&
      missing.length > 0 &&
      typeof console !== 'undefined' &&
      console.warn
    ) {
      console.warn(
        `[WebLogger] Default sensitive patterns removed: ${missing.join(
          ', ',
        )}. Ensure this is intentional.`,
      );
    }
  }

  setSuppressWarnings(value: boolean): void {
    this.suppressWarnings = value;
  }
}
