import { NavigatorLockAcquireTimeoutError, processLock } from '@supabase/supabase-js';

/** Keep cross-tab exclusion without stealing a lock from an active request. */
export async function sessionLock<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return processLock(name, acquireTimeout, fn);
  }

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (acquireTimeout > 0) {
    timer = setTimeout(() => controller.abort(), acquireTimeout);
  }
  try {
    return await navigator.locks.request(
      name,
      acquireTimeout === 0
        ? { mode: 'exclusive', ifAvailable: true }
        : { mode: 'exclusive', signal: controller.signal },
      async (lock) => {
        // The timeout only applies while waiting, never while executing fn.
        clearTimeout(timer);
        if (!lock) {
          throw new NavigatorLockAcquireTimeoutError('No se pudo obtener el bloqueo de sesión');
        }
        return await fn();
      },
    );
  } catch (error) {
    if (controller.signal.aborted) {
      throw new NavigatorLockAcquireTimeoutError('Se agotó el tiempo de espera del bloqueo de sesión');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}