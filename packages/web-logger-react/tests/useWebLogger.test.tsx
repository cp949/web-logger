import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebLogger } from '../src/useWebLogger';

describe('useWebLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create logger with prefix', () => {
    const { result } = renderHook(() => useWebLogger('[UserList]'));

    expect(result.current).toBeDefined();
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.debug).toBe('function');
    expect(typeof result.current.warn).toBe('function');
    expect(typeof result.current.error).toBe('function');

    const spy = vi.spyOn(result.current, 'info');
    result.current.info('test message');

    expect(spy).toHaveBeenCalledWith('test message');
  });

  it('should create logger without prefix', () => {
    const { result } = renderHook(() => useWebLogger());

    expect(result.current).toBeDefined();
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.debug).toBe('function');
    expect(typeof result.current.warn).toBe('function');
    expect(typeof result.current.error).toBe('function');
  });

  it('should memoize logger instance when prefix does not change', () => {
    const { result, rerender } = renderHook(
      ({ prefix }) => useWebLogger(prefix),
      { initialProps: { prefix: '[UserList]' } }
    );

    const firstInstance = result.current;
    rerender({ prefix: '[UserList]' });

    expect(result.current).toBe(firstInstance);
  });

  it('should create new logger instance when prefix changes', () => {
    const { result, rerender } = renderHook(
      ({ prefix }) => useWebLogger(prefix),
      { initialProps: { prefix: '[UserList]' } }
    );

    const firstInstance = result.current;
    rerender({ prefix: '[UserDetails]' });

    expect(result.current).not.toBe(firstInstance);
  });

  it('should handle undefined prefix correctly', () => {
    const { result, rerender } = renderHook(
      ({ prefix }) => useWebLogger(prefix),
      { initialProps: { prefix: undefined } }
    );

    const firstInstance = result.current;
    rerender({ prefix: undefined });

    expect(result.current).toBe(firstInstance);
  });

  it('should create new logger when prefix changes from undefined to defined', () => {
    const { result, rerender } = renderHook(
      ({ prefix }) => useWebLogger(prefix),
      { initialProps: { prefix: undefined } }
    );

    const firstInstance = result.current;
    rerender({ prefix: '[UserList]' });

    expect(result.current).not.toBe(firstInstance);
  });

  it('should create new logger when prefix changes from defined to undefined', () => {
    const { result, rerender } = renderHook(
      ({ prefix }) => useWebLogger(prefix),
      { initialProps: { prefix: '[UserList]' } }
    );

    const firstInstance = result.current;
    rerender({ prefix: undefined });

    expect(result.current).not.toBe(firstInstance);
  });

  it('should return shared webLogger when prefix is undefined', () => {
    const { result } = renderHook(() => useWebLogger());

    // shared instance reuse across renders
    const firstInstance = result.current;
    const { result: rerendered } = renderHook(() => useWebLogger());
    expect(rerendered.current).toBe(firstInstance);
  });
});
