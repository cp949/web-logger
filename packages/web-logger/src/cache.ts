/**
 * 캐시 관련 유틸리티
 */

/**
 * 간단한 LRU 캐시 구현
 * 최근 사용된 항목을 유지하고, 최대 크기를 초과하면 가장 오래된 항목을 제거합니다.
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 최근 사용된 항목을 맨 뒤로 이동 (LRU)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // 이미 존재하는 경우 제거 후 다시 추가
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 최대 크기 초과 시 가장 오래된 항목(첫 번째) 제거
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// 성능 최적화: 객체 sanitize 결과 캐싱 (WeakMap 활용)
let sanitizeCache = new WeakMap<object, unknown>();

// 마스킹 값 캐시 (LRU, 최대 1000개)
export const maskValueCache = new LRUCache<string, string>(1000);

/**
 * 민감 키 변경 시 캐시 무효화
 */
export const clearSanitizeCache = (): void => {
  sanitizeCache = new WeakMap<object, unknown>();
  maskValueCache.clear();
};

/**
 * sanitize 캐시에 저장
 */
export const setSanitizeCache = (key: object, value: unknown): void => {
  sanitizeCache.set(key, value);
};

/**
 * sanitize 캐시에서 가져오기
 */
export const getSanitizeCache = (key: object): unknown | undefined => {
  return sanitizeCache.get(key);
};

/**
 * sanitize 캐시에 존재하는지 확인
 */
export const hasSanitizeCache = (key: object): boolean => {
  return sanitizeCache.has(key);
};
