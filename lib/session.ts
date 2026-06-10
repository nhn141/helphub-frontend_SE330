import { refreshSession, type AuthResponse } from "./api";

export type StoredSession = AuthResponse & {
  savedAt: number;
};

const SESSION_STORAGE_KEY = "helphub.auth.session";

export function saveSession(session: AuthResponse): StoredSession | null {
  if (!canUseStorage()) {
    return null;
  }

  const storedSession: StoredSession = {
    ...session,
    savedAt: Date.now(),
  };

  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(storedSession),
  );

  return storedSession;
}

export function readSession(): StoredSession | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as StoredSession;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  if (canUseStorage()) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function getAccessTokenExpiry(session: StoredSession): number {
  return session.savedAt + session.accessTokenExpiresIn;
}

export function isAccessTokenExpired(
  session: StoredSession,
  skewMs = 30_000,
): boolean {
  return Date.now() + skewMs >= getAccessTokenExpiry(session);
}

export async function getValidSession(): Promise<StoredSession | null> {
  const session = readSession();

  if (!session) {
    return null;
  }

  if (!isAccessTokenExpired(session)) {
    return session;
  }

  try {
    return saveSession(await refreshSession(session.refreshToken));
  } catch {
    clearSession();
    return null;
  }
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

