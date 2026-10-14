import { useCallback, useRef, useState } from "react";

/**
 * Prevents double-submit from rapid clicks.
 * React `useState` alone is not enough — two clicks in the same tick can both
 * see `submitting === false` before the re-render. A ref locks synchronously.
 *
 * Usage:
 *   const { submitting, run } = useSubmitLock();
 *   const onSubmit = (e) => {
 *     e.preventDefault();
 *     run(async () => { await api(...); });
 *   };
 *   <Button disabled={submitting}>...</Button>
 */
export function useSubmitLock() {
  const lockRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const run = useCallback(async (fn) => {
    if (lockRef.current) return undefined;
    lockRef.current = true;
    setSubmitting(true);
    try {
      return await fn();
    } finally {
      lockRef.current = false;
      setSubmitting(false);
    }
  }, []);

  /** Synchronous check — use at the very top of handlers before any await. */
  const isLocked = useCallback(() => lockRef.current, []);

  /** Try to acquire the lock without running work (manual control). */
  const tryLock = useCallback(() => {
    if (lockRef.current) return false;
    lockRef.current = true;
    setSubmitting(true);
    return true;
  }, []);

  const unlock = useCallback(() => {
    lockRef.current = false;
    setSubmitting(false);
  }, []);

  return { submitting, run, isLocked, tryLock, unlock };
}
