"use client";
import { useSyncExternalStore } from "react";
const eventName = "devtoolbox-preferences";
function subscribe(listener) {
  window.addEventListener("storage", listener);
  window.addEventListener(eventName, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(eventName, listener);
  };
}
function read(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
export function usePreference(key, fallback) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
  const setValue = (next) => {
    try {
      localStorage.setItem(key, next);
      window.dispatchEvent(new Event(eventName));
    } catch {
      /* Preferences remain optional when browser storage is disabled. */
    }
  };
  return [value, setValue];
}
