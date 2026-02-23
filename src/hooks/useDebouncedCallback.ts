import { useRef, useCallback, useEffect } from "react";

/**
 * Returns a callback that, when called, runs after `delayMs` ms of no further calls.
 * Useful for debounced name search while still allowing Enter to submit immediately.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number
): (...args: A) => void {
  const fnRef = useRef(fn);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<A | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args: A) => {
      lastArgsRef.current = args;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        const stored = lastArgsRef.current;
        if (stored) fnRef.current(...stored);
      }, delayMs);
    },
    [delayMs]
  );
}
