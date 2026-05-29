"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ApiError,
  getMyProfile,
  refreshSession,
  type UserProfile,
} from "@/lib/api";
import {
  clearSession,
  isAccessTokenExpired,
  readSession,
  saveSession,
} from "@/lib/session";

export default function DashboardClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState("Đang tải dashboard...");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const storedSession = readSession();

        if (!storedSession) {
          router.replace("/");
          return;
        }

        const activeSession = isAccessTokenExpired(storedSession)
          ? saveSession(await refreshSession(storedSession.refreshToken))
          : storedSession;

        if (!activeSession) {
          router.replace("/");
          return;
        }

        const currentProfile = await getMyProfile(activeSession.accessToken);

        if (!cancelled) {
          setProfile(currentProfile);
          setMessage("Chào mừng bạn quay lại HelpHub.");
        }
      } catch (error) {
        clearSession();

        if (!cancelled) {
          setMessage(getErrorMessage(error));
          router.replace("/");
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleLogout() {
    clearSession();
    router.replace("/");
  }

  return (
    <main className="min-h-dvh bg-[#f7f8f5] px-5 py-8 text-slate-950 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-4xl items-center justify-center">
        <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-sm font-semibold text-emerald-700">HelpHub</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
            {profile ? `Xin chào, ${profile.fullName}!` : "Xin chào!"}
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{message}</p>

          {profile ? (
            <div className="mt-6 rounded-md border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">
                Bạn đã đăng nhập với email {profile.email}.
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Đăng xuất
          </button>
        </div>
      </section>
    </main>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể tải dashboard.";
}
