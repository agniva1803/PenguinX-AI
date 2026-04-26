import { createRoot } from "react-dom/client";
import "./index.css";

const AUTH_EXPIRY_MARGIN_SECONDS = 120;

const getSessionExpiry = (storedValue: unknown): number | null => {
  const record = storedValue as Record<string, any> | null;
  const session = record?.currentSession ?? record?.session ?? record;
  const rawExpiry = session?.expires_at ?? session?.expiresAt ?? record?.expires_at ?? record?.expiresAt;

  if (typeof rawExpiry === "number") {
    return rawExpiry > 10_000_000_000 ? Math.floor(rawExpiry / 1000) : rawExpiry;
  }

  if (typeof rawExpiry === "string") {
    const parsed = Number(rawExpiry);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const token = session?.access_token ?? record?.access_token;
  if (typeof token === "string") {
    try {
      const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
      return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
      return null;
    }
  }

  return null;
};

const clearExpiredAuthTokensBeforeClientStarts = () => {
  if (typeof window === "undefined") return;

  const now = Math.floor(Date.now() / 1000);
  const storages = [window.localStorage, window.sessionStorage];

  for (const storage of storages) {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (!key || (!/^sb-.+-auth-token$/.test(key) && !key.includes("supabase.auth.token"))) {
        continue;
      }

      try {
        const expiry = getSessionExpiry(JSON.parse(storage.getItem(key) ?? "null"));
        if (!expiry || expiry <= now + AUTH_EXPIRY_MARGIN_SECONDS) {
          storage.removeItem(key);
        }
      } catch {
        storage.removeItem(key);
      }
    }
  }
};

clearExpiredAuthTokensBeforeClientStarts();

void import("./App.tsx").then(({ default: App }) => {
  createRoot(document.getElementById("root")!).render(<App />);
});
