"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";

import {
    ApiError,
    getMyProfile,
    login,
    register,
    type RegisterPayload,
} from "@/lib/api";
import { clearSession, saveSession } from "@/lib/session";

type AuthMode = "login" | "register";
type BusyState = "login" | "register" | null;
type Notice = { type: "success" | "error"; message: string } | null;

const roleOptions: Array<{
    value: RegisterPayload["role"];
    label: string;
    description: string;
}> = [
    {
        value: "REQUESTER",
        label: "Requester",
        description: "Create requests and track support.",
    },
    {
        value: "VOLUNTEER",
        label: "Volunteer",
        description: "Join assignments and contribute resources.",
    },
];

const initialLoginForm = {
    email: "",
    password: "",
};

const initialRegisterForm = {
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "REQUESTER" as RegisterPayload["role"],
};

export default function AuthClient() {
    const router = useRouter();
    const [mode, setMode] = useState<AuthMode>("login");
    const [loginForm, setLoginForm] = useState(initialLoginForm);
    const [registerForm, setRegisterForm] = useState(initialRegisterForm);
    const [busy, setBusy] = useState<BusyState>(null);
    const [notice, setNotice] = useState<Notice>(null);

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy("login");
        setNotice(null);

        try {
            const auth = await login({
                email: loginForm.email.trim(),
                password: loginForm.password,
            });

            const profile = await getMyProfile(auth.accessToken);

            saveSession(auth);
            setNotice({ type: "success", message: "Signed in successfully." });

            if (profile.role === "ADMIN") {
                window.location.href = "/admin/dashboard";
            } else {
                window.location.href = "/dashboard";
            }
        } catch (error) {
            setNotice({ type: "error", message: getErrorMessage(error) });
            clearSession();
        } finally {
            setBusy(null);
        }
    }

    async function handleRegister(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy("register");
        setNotice(null);

        try {
            const payload: RegisterPayload = {
                fullName: registerForm.fullName.trim(),
                email: registerForm.email.trim(),
                password: registerForm.password,
                role: registerForm.role,
            };

            if (registerForm.phone.trim()) {
                payload.phone = registerForm.phone.trim();
            }

            await register(payload);
            clearSession();
            setRegisterForm(initialRegisterForm);
            setLoginForm({
                email: payload.email,
                password: "",
            });
            setMode("login");
            setNotice({
                type: "success",
                message: "Your account was created successfully.",
            });
        } catch (error) {
            setNotice({ type: "error", message: getErrorMessage(error) });
        } finally {
            setBusy(null);
        }
    }

    return (
        <main className="min-h-dvh bg-[#f7f8f5] text-slate-950">
            <div className="grid min-h-dvh lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,0.68fr)]">
                <section className="relative min-h-[380px] overflow-hidden bg-slate-950 text-white lg:min-h-dvh">
                    <Image
                        src="/helphub-auth-hero.png"
                        alt="Volunteers coordinating community relief supplies"
                        fill
                        priority
                        sizes="(min-width: 1024px) 58vw, 100vw"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/35" />
                    <div className="relative z-10 flex min-h-[380px] flex-col justify-between p-6 sm:p-10 lg:min-h-dvh lg:p-12">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-md bg-white text-base font-bold text-emerald-700 shadow-sm">
                                H
                            </div>
                            <div>
                                <p className="text-lg font-semibold">HelpHub</p>
                                <p className="text-sm text-white/78">
                                    Support that reaches people
                                </p>
                            </div>
                        </div>

                        <div className="max-w-xl">
                            <h1 className="hero-slogan text-4xl font-semibold leading-[1.12] sm:text-5xl lg:text-6xl">
                                Connecting people who need support with
                                volunteers everywhere
                            </h1>
                        </div>
                    </div>
                </section>

                <section className="flex min-h-dvh items-center px-5 py-8 sm:px-8 lg:px-10">
                    <div className="mx-auto w-full max-w-[520px]">
                        <div className="mb-6 lg:hidden">
                            <p className="text-2xl font-semibold">HelpHub</p>
                            <p className="mt-1 text-sm text-slate-600">
                                Support that reaches people
                            </p>
                        </div>

                        <AuthPanel
                            busy={busy}
                            loginForm={loginForm}
                            mode={mode}
                            onLogin={handleLogin}
                            onModeChange={(nextMode) => {
                                setMode(nextMode);
                                setNotice(null);
                            }}
                            onRegister={handleRegister}
                            registerForm={registerForm}
                            setLoginForm={setLoginForm}
                            setRegisterForm={setRegisterForm}
                        />

                        {notice ? <NoticeBanner notice={notice} /> : null}
                    </div>
                </section>
            </div>
        </main>
    );
}

function AuthPanel({
    busy,
    loginForm,
    mode,
    onLogin,
    onModeChange,
    onRegister,
    registerForm,
    setLoginForm,
    setRegisterForm,
}: {
    busy: BusyState;
    loginForm: typeof initialLoginForm;
    mode: AuthMode;
    onLogin: (event: FormEvent<HTMLFormElement>) => void;
    onModeChange: (mode: AuthMode) => void;
    onRegister: (event: FormEvent<HTMLFormElement>) => void;
    registerForm: typeof initialRegisterForm;
    setLoginForm: (value: typeof initialLoginForm) => void;
    setRegisterForm: (value: typeof initialRegisterForm) => void;
}) {
    const isLogin = mode === "login";

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-7">
            <div className="mb-6">
                <h2 className="text-3xl font-semibold leading-tight text-emerald-700 sm:text-[2rem]">
                    {isLogin ? "Sign in" : "Create an account"}
                </h2>
            </div>

            <div
                className="mb-6 grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-50 p-1"
                role="tablist"
                aria-label="Choose authentication mode"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={isLogin}
                    className={tabClassName(isLogin)}
                    onClick={() => onModeChange("login")}
                >
                    Sign in
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={!isLogin}
                    className={tabClassName(!isLogin)}
                    onClick={() => onModeChange("register")}
                >
                    Register
                </button>
            </div>

            {isLogin ? (
                <form className="space-y-4" onSubmit={onLogin}>
                    <TextField
                        autoComplete="email"
                        label="Email"
                        name="email"
                        onChange={(value) =>
                            setLoginForm({ ...loginForm, email: value })
                        }
                        placeholder="you@example.com"
                        required
                        type="email"
                        value={loginForm.email}
                    />
                    <TextField
                        autoComplete="current-password"
                        label="Password"
                        name="password"
                        onChange={(value) =>
                            setLoginForm({ ...loginForm, password: value })
                        }
                        placeholder="Enter your password"
                        required
                        type="password"
                        value={loginForm.password}
                    />
                    <button
                        type="submit"
                        disabled={busy === "login"}
                        className="mt-2 h-11 w-full rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {busy === "login" ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            ) : (
                <form className="space-y-4" onSubmit={onRegister}>
                    <TextField
                        autoComplete="name"
                        label="Full name"
                        maxLength={50}
                        name="fullName"
                        onChange={(value) =>
                            setRegisterForm({
                                ...registerForm,
                                fullName: value,
                            })
                        }
                        required
                        value={registerForm.fullName}
                    />
                    <TextField
                        autoComplete="email"
                        label="Email"
                        maxLength={50}
                        name="registerEmail"
                        onChange={(value) =>
                            setRegisterForm({ ...registerForm, email: value })
                        }
                        placeholder="you@example.com"
                        required
                        type="email"
                        value={registerForm.email}
                    />
                    <TextField
                        autoComplete="new-password"
                        label="Password (at least 8 characters)"
                        maxLength={100}
                        minLength={8}
                        name="registerPassword"
                        onChange={(value) =>
                            setRegisterForm({
                                ...registerForm,
                                password: value,
                            })
                        }
                        required
                        type="password"
                        value={registerForm.password}
                    />
                    <TextField
                        autoComplete="tel"
                        label="Phone number"
                        maxLength={20}
                        name="phone"
                        onChange={(value) =>
                            setRegisterForm({ ...registerForm, phone: value })
                        }
                        type="tel"
                        value={registerForm.phone}
                    />

                    <fieldset>
                        <legend className="mb-2 block text-sm font-medium text-slate-700">
                            Role
                        </legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {roleOptions.map((option) => {
                                const checked =
                                    registerForm.role === option.value;

                                return (
                                    <label
                                        key={option.value}
                                        className={`min-h-[96px] cursor-pointer rounded-md border p-3 transition ${
                                            checked
                                                ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            className="sr-only"
                                            checked={checked}
                                            onChange={() =>
                                                setRegisterForm({
                                                    ...registerForm,
                                                    role: option.value,
                                                })
                                            }
                                        />
                                        <span className="block text-sm font-semibold">
                                            {option.label}
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-slate-600">
                                            {option.description}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    <button
                        type="submit"
                        disabled={busy === "register"}
                        className="mt-2 h-11 w-full rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {busy === "register"
                            ? "Creating account..."
                            : "Register"}
                    </button>
                </form>
            )}
        </div>
    );
}

function TextField({
    label,
    name,
    onChange,
    value,
    type = "text",
    ...inputProps
}: {
    label: string;
    name: string;
    onChange: (value: string) => void;
    value: string;
    type?: string;
} & Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "className" | "name" | "onChange" | "type" | "value"
>) {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const inputId = useId();
    const isPassword = type === "password";
    const inputType = isPassword && passwordVisible ? "text" : type;

    return (
        <div>
            <label
                htmlFor={inputId}
                className="mb-2 block text-sm font-medium text-slate-700"
            >
                {label}
            </label>
            <span className="relative block">
                <input
                    {...inputProps}
                    id={inputId}
                    name={name}
                    type={inputType}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className={`h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${
                        isPassword ? "pr-11" : ""
                    }`}
                />
                {isPassword ? (
                    <button
                        type="button"
                        aria-label={
                            passwordVisible ? "Hide password" : "Show password"
                        }
                        title={
                            passwordVisible ? "Hide password" : "Show password"
                        }
                        onClick={() =>
                            setPasswordVisible((current) => !current)
                        }
                        className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                        <EyeIcon crossed={passwordVisible} />
                    </button>
                ) : null}
            </span>
        </div>
    );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
        >
            <path d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6-9.75-6Z" />
            <circle cx="12" cy="12" r="2.75" />
            {crossed ? <path d="M4.5 19.5 19.5 4.5" /> : null}
        </svg>
    );
}

function NoticeBanner({ notice }: { notice: Exclude<Notice, null> }) {
    return (
        <div
            className={`mt-4 rounded-md border px-4 py-3 text-sm ${
                notice.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
            role="status"
        >
            {notice.message}
        </div>
    );
}

function tabClassName(active: boolean): string {
    return `h-10 rounded-md px-3 text-sm font-semibold transition ${
        active
            ? "bg-white text-emerald-800 shadow-sm"
            : "text-slate-500 hover:text-slate-800"
    }`;
}

function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong. Please try again.";
}
