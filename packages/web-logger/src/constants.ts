import type { LogLevel, LogLevelConfig, SensitivePatternMap } from './types';

/**
 * 기본 민감 패턴 정의
 */
export const DEFAULT_SENSITIVE_PATTERNS: SensitivePatternMap = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  card: /\b\d{4}[\s\-\.\/]?\d{4}[\s\-\.\/]?\d{4}[\s\-\.\/]?\d{3,4}\b/g,
  phone: /(\+82|0)[\s\-\.]?\d{1,2}[\s\-\.]?\d{3,4}[\s\-\.]?\d{4}/g,
  ssn: /\b\d{6}[\s\-]?\d{7}\b/g,
  jwt: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g,
  apiKey: /[a-zA-Z0-9]{32,}/g,
  password: /password['":\s]*['"'][^'"]*['"']/gi,
};

/**
 * 프로토타입 오염 방지를 위한 안전하지 않은 키
 */
export const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];

/**
 * 성능 및 보안 상수
 */
export const MAX_STRING_LENGTH = 5000; // ReDoS 공격 방지를 위한 문자열 길이 제한
export const REGEX_TIMEOUT_MS = 100; // 정규식 실행 시간 제한 (밀리초)
export const MAX_DEPTH = 10; // 순환 참조 방지를 위한 최대 깊이

/**
 * 로그 레벨별 설정
 */
export const LOG_LEVEL_CONFIGS: Record<LogLevel, LogLevelConfig> = {
  debug: {
    style: 'color: #6B7280; font-weight: normal;',
    label: 'DEBUG',
  },
  info: {
    style: 'color: #3B82F6; font-weight: normal;',
    label: 'INFO',
  },
  warn: {
    style: 'color: #F59E0B; font-weight: bold;',
    label: 'WARN',
  },
  error: {
    style: 'color: #EF4444; font-weight: bold;',
    label: 'ERROR',
  },
  none: {
    style: '',
    label: '',
  },
};
