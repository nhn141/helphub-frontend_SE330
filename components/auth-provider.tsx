"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getMyProfile, type UserProfile } from "@/lib/api";
import {
  clearSession,
  getValidSession,
  type StoredSession,
} from "@/lib/session";

type AuthContextValue = {
  profile: UserProfile;
  getAccessToken: () => Promise<string>;
  reloadProfile: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requireSession = useCallback(async (): Promise<StoredSession> => {
    const session = await getValidSession();

    if (!session) {
      router.replace("/");
      throw new Error("Your session has expired.");
    }

    return session;
  }, [router]);

  const getAccessToken = useCallback(async () => {
    const session = await requireSession();
    return session.accessToken;
  }, [requireSession]);

  const reloadProfile = useCallback(async () => {
    const session = await requireSession();
    const currentProfile = await getMyProfile(session.accessToken);
    setProfile(currentProfile);
    setError(null);
  }, [requireSession]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const session = await requireSession();
        const currentProfile = await getMyProfile(session.accessToken);

        if (!cancelled) {
          setProfile(currentProfile);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [requireSession]);

  const logout = useCallback(() => {
    clearSession();
    router.replace("/");
  }, [router]);

  const value = useMemo(
    () =>
      profile
        ? {
            profile,
            getAccessToken,
            reloadProfile,
            logout,
          }
        : null,
    [getAccessToken, logout, profile, reloadProfile],
  );

  if (loading) {
    return <PortalLoading message="Authenticating your account..." />;
  }

  if (!profile || !value) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f4f6f2] px-5">
        <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-700">
            <AlertIcon />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-950">
            Unable to open HelpHub
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {error ?? "Please sign in again to continue."}
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-5 h-10 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

function PortalLoading({ message }: { message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f4f6f2] px-5">
      <div className="text-center">
        <div className="mx-auto size-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
        <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
      </div>
    </main>
  );
}

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 8v5" strokeLinecap="round" />
      <path d="M12 17.2h.01" strokeLinecap="round" />
      <path
        d="M10.1 4.2 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.9 4.2a2.2 2.2 0 0 0-3.8 0Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to authenticate your account.";
}
