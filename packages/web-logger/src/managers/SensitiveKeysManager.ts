import { clearSanitizeCache } from '../cache';

/**
 * 전역 민감한 키 관리자 (싱글톤)
 * 모든 WebLogger 인스턴스가 동일한 민감한 키 목록을 공유하도록 함
 */
export class SensitiveKeysManager {
  private static instance: SensitiveKeysManager;
  private sensitiveKeys: Set<string>;

  /**
   * 기본 민감한 키 목록
   *
   * 객체 속성 키가 이 목록의 키워드와 일치하면 (대소문자 구분 없음),
   * 값의 내용과 관계없이 전체 값이 부분 마스킹됩니다.
   *
   * 총 28개의 기본 키를 포함하며, 다음과 같이 분류됩니다:
   * - 인증 관련 (10개): password, pwd, passwd, token, apiKey, api_key,
   *   accessToken, refreshToken, authToken, authorization
   * - 개인정보 관련 (6개): email, phone, phoneNumber, mobile,
   *   ssn, socialSecurityNumber, residentNumber, resident_number
   * - 결제 관련 (3개): creditCard, cardNumber, card_number
   * - 보안 관련 (7개): secret, secretKey, privateKey, private_key,
   *   sessionId, session_id, cookie, cookies
   *
   * 사용자는 `addSensitiveKey()` 또는 `removeSensitiveKey()`를 통해
   * 동적으로 키 목록을 관리할 수 있습니다.
   *
   * @see SensitiveKeysManager.isSensitive()
   */
  private readonly defaultKeys = [
    // 인증 관련 (10개)
    'password',
    'pwd',
    'passwd',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
    'authToken',
    'authorization',
    // 개인정보 관련 (6개)
    'email',
    'phone',
    'phoneNumber',
    'mobile',
    'ssn',
    'socialSecurityNumber',
    'residentNumber',
    'resident_number',
    // 결제 관련 (3개)
    'creditCard',
    'cardNumber',
    'card_number',
    // 보안 관련 (7개)
    'secret',
    'secretKey',
    'privateKey',
    'private_key',
    'sessionId',
    'session_id',
    'cookie',
    'cookies',
  ];

  private constructor() {
    this.sensitiveKeys = new Set(this.defaultKeys.map((key) => key.toLowerCase()));
  }

  static getInstance(): SensitiveKeysManager {
    if (!SensitiveKeysManager.instance) {
      SensitiveKeysManager.instance = new SensitiveKeysManager();
    }
    return SensitiveKeysManager.instance;
  }

  /**
   * 민감한 키 추가
   *
   * 새로운 민감 키워드를 목록에 추가합니다. 키는 대소문자 구분 없이 저장되며,
   * 추가 시 sanitize 캐시가 자동으로 초기화됩니다.
   *
   * @param key 추가할 키 (대소문자 구분 없음, 빈 문자열 제외)
   *
   * @example
   * ```typescript
   * addKey('customSecret');
   * addKey('apiSecret');
   * ```
   */
  addKey(key: string): void {
    if (typeof key === 'string' && key.length > 0) {
      this.sensitiveKeys.add(key.toLowerCase());
      clearSanitizeCache();
    }
  }

  /**
   * 민감한 키 제거
   *
   * 목록에서 민감 키워드를 제거합니다. 키는 대소문자 구분 없이 매칭되며,
   * 제거 시 sanitize 캐시가 자동으로 초기화됩니다.
   *
   * @param key 제거할 키 (대소문자 구분 없음, 빈 문자열 제외)
   *
   * @example
   * ```typescript
   * removeKey('email'); // email 필터링 비활성화
   * ```
   */
  removeKey(key: string): void {
    if (typeof key === 'string' && key.length > 0) {
      this.sensitiveKeys.delete(key.toLowerCase());
      clearSanitizeCache();
    }
  }

  /**
   * 민감한 키 목록을 교체
   *
   * 기존 키 목록을 모두 제거하고 새로운 키 목록으로 교체합니다.
   * 빈 값은 자동으로 필터링되며, 모든 키는 소문자로 변환되어 저장됩니다.
   *
   * @param keys 새 키 배열 (빈 값은 자동 제외)
   */
  setKeys(keys: string[]): void {
    this.sensitiveKeys = new Set(keys.filter(Boolean).map((key) => key.toLowerCase()));
    clearSanitizeCache();
  }

  /**
   * 현재 민감한 키 목록 가져오기
   *
   * 현재 활성화된 모든 민감 키워드를 정렬된 배열로 반환합니다.
   * 반환된 배열은 복사본이므로 원본 목록에 영향을 주지 않습니다.
   *
   * @returns 민감한 키 배열 (정렬된 복사본, 소문자)
   */
  getKeys(): string[] {
    return Array.from(this.sensitiveKeys).sort();
  }

  /**
   * 기본 키 목록으로 초기화
   *
   * 민감 키 목록을 기본 28개 키로 초기화합니다.
   * 사용자가 추가/제거한 모든 키가 제거되고 기본값으로 복원됩니다.
   * 초기화 시 sanitize 캐시가 자동으로 초기화됩니다.
   */
  reset(): void {
    this.sensitiveKeys = new Set(this.defaultKeys.map((key) => key.toLowerCase()));
    clearSanitizeCache();
  }

  /**
   * 키가 민감한 키인지 확인
   *
   * 키 이름이 민감 키워드 목록에 포함되어 있는지 확인합니다.
   * 대소문자를 구분하지 않으며, 부분 일치도 허용합니다.
   * 예: 'apiKey', 'ApiKey', 'myApiKey' 모두 민감 키로 인식
   *
   * @param key 확인할 키 (문자열)
   * @returns 키가 민감 키워드를 포함하면 `true`, 그렇지 않으면 `false`
   *
   * @example
   * ```typescript
   * isSensitive('password'); // true
   * isSensitive('apiKey'); // true
   * isSensitive('myApiKey'); // true (부분 일치)
   * isSensitive('username'); // false
   * ```
   */
  isSensitive(key: string): boolean {
    if (typeof key !== 'string' || key.length === 0) {
      return false;
    }
    const lowerKey = key.toLowerCase();
    return Array.from(this.sensitiveKeys).some((sensitive) => lowerKey.includes(sensitive));
  }
}
