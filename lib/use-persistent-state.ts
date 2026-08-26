"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * State mirrored into localStorage.
 *
 * localStorage is an external store, so it is read through useSyncExternalStore
 * rather than hydrated with a setState inside an effect. That keeps server and
 * client renders consistent (the server snapshot is always the fallback) and gets
 * cross-tab updates for free — a user with the wizard open in two tabs sees one draft.
 */

const CHANGE_EVENT = "mandala:storage";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  // Fired by other tabs on the same origin.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private windows and blocked site data throw on access.
    return null;
  }
}

/**
 * `fallback` must be referentially stable — pass a module-level constant, not an
 * inline literal, or every render produces a new value.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
): [T, (next: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  const value = useMemo(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const set = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Persistence is a convenience; the UI still works without it.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return [value, set];
}

/**
 * Read several keys at once — the dashboard listing every saved draft.
 *
 * The snapshot is a single JSON string so React can compare it by value; building a
 * fresh array on each call would look like a new store value on every render.
 * `keys` must be referentially stable.
 */
export function usePersistentMap<T>(keys: string[], fallback: T): Record<string, T> {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(keys.map(read)),
    () => "null",
  );

  return useMemo(() => {
    const out: Record<string, T> = {};
    let values: (string | null)[];
    try {
      values = (JSON.parse(snapshot) as (string | null)[] | null) ?? [];
    } catch {
      values = [];
    }
    keys.forEach((key, i) => {
      const raw = values[i];
      if (raw == null) return;
      try {
        out[key] = JSON.parse(raw) as T;
      } catch {
        out[key] = fallback;
      }
    });
    return out;
  }, [snapshot, keys, fallback]);
}
