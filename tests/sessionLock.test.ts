import { afterEach, expect, test } from 'bun:test';
import { sessionLock } from '../src/lib/sessionLock';

const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'navigator', original);
  else Reflect.deleteProperty(globalThis, 'navigator');
});

test('session requests never steal another active lock', async () => {
  let options: LockOptions | undefined;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    locks: { request: async (_name: string, opts: LockOptions, fn: (lock: object) => Promise<unknown>) => {
      options = opts;
      return fn({ name: 'session' });
    } },
  } });
  expect(await sessionLock('session', 100, async () => 42)).toBe(42);
  expect(options?.mode).toBe('exclusive');
  expect(options?.steal).not.toBe(true);
});

test('waiting timeout does not execute the protected operation', async () => {
  let executed = false;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    locks: { request: (_name: string, opts: LockOptions) => new Promise((_resolve, reject) => {
      opts.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }) },
  } });
  await expect(sessionLock('session', 5, async () => { executed = true; })).rejects.toMatchObject({ isAcquireTimeout: true });
  expect(executed).toBe(false);
});

test('an acquired lock is not aborted while its operation runs', async () => {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    locks: { request: async (_name: string, opts: LockOptions, fn: (lock: object) => Promise<unknown>) => {
      const result = await fn({ name: 'session' });
      expect(opts.signal?.aborted).toBe(false);
      return result;
    } },
  } });
  expect(await sessionLock('session', 5, async () => {
    await new Promise(resolve => setTimeout(resolve, 15));
    return 'ok';
  })).toBe('ok');
});