"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";

import {
    ApiError,
    forgotPassword,
    getMyProfile,
    login,
    register,
    resendEmailOtp,
    resetPassword,
    verifyEmail,
    type RegisterPayload,
} from "@/lib/api";
import { clearSession, saveSession } from "@/lib/session";

type AuthMode = "login" | "register" | "verify" | "forgot" | "reset";
type BusyState =
    | AuthMode
    | "resendVerification"
    | "resendReset"
    | null;
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

const primaryModes: AuthMode[] = ["login", "register"];

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

const initialEmailOtpForm = {
    email: "",
    otp: "",
};

const initialForgotPasswordForm = {
    email: "",
};

const initialResetPasswordForm = {
    email: "",
    otp: "",
    newPassword: "",
};

export default function AuthClient() {
    const router = useRouter();
    const [mode, setMode] = useState<AuthMode>("login");
    const [loginForm, setLoginForm] = useState(initialLoginForm);
    const [registerForm, setRegisterForm] = useState(initialRegisterForm);
    const [verifyForm, setVerifyForm] = useState(initialEmailOtpForm);
    const [forgotForm, setForgotForm] = useState(initialForgotPasswordForm);
    const [resetForm, setResetForm] = useState(initialResetPasswordForm);
    const [busy, setBusy] = useState<BusyState>(null);
    const [notice, setNotice] = useState<Notice>(null);

    function changeMode(nextMode: AuthMode) {
        if (busy) {
            return;
        }

        if (nextMode === "verify") {
            const email =
                verifyForm.email || loginForm.email || registerForm.email;
            setVerifyForm({ ...verifyForm, email: email.trim() });
        }

        if (nextMode === "forgot") {
            setForgotForm({ email: loginForm.email.trim() });
        }

        setMode(nextMode);
        setNotice(null);
    }

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy("login");
        setNotice(null);

        try {
            const auth = await login({
                email: loginForm.email.trim(),
                password: loginForm.password,
            });

            if (!auth.accessToken || !auth.refreshToken) {
                throw new ApiError(
                    "The login response did not include session tokens.",
                    500,
                    auth,
                );
            }

            const profile = await getMyProfile(auth.accessToken);

            saveSession(auth);
            setNotice({ type: "success", message: "Signed in successfully." });
            router.replace(
                profile.role === "ADMIN" ? "/admin/dashboard" : "/dashboard",
            );
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

            const response = await register(payload);

            clearSession();
            setRegisterForm(initialRegisterForm);
            setLoginForm({ email: payload.email, password: "" });
            setVerifyForm({ email: payload.email, otp: "" });
            setMode("verify");
            setNotice({
                type: "success",
                message:
                    response.message ??
                    "Account created. Check your email for the verification code.",
            });
        } catch (error) {
            setNotice({ type: "error", message: getErrorMessage(error) });
        } finally {
            setBusy(null);
        }
    }

    async function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy("verify");
        setNotice(null);

        try {
            const email = verifyForm.email.trim();
            const message = await verifyEmail({
                email,
                otp: verifyForm.otp.trim(),
            });

            setVerifyForm({ email, otp: "" });
            setLoginForm({ email, password: "" });
            setMode("login");
            setNotice({ type: "success", message });
        } catch (error) {
            setNotice({ type: "error", message: getErrorMessage(error) });
        } finally {
            setBusy(null);
        }
    }

    async function handleResendVerification() {
        const email = verifyForm.email.trim();

        if (!email) {
            setNotice({
                type: "error",
                message: "Enter your email before requesting a new code.",
            });
            return;
        }

        setBusy("resendVerification");
        setNotice(null);

        try {
            const message = await resendEmailOtp({ email });
            setNotice({ type: "success", message });
        } catch (error) {
            setNotice({ type: "error", message: getErrorMessage(error) });
        } finally {
            setBusy(null);
        }
    }

    async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy("forgot");
        setNotice(null);

        try {
            const email = forgotForm.email.trim();
            const message = await forgotPassword({ email });

            setResetForm({ email, otp: "", newPassword: "" });
            setMode("reset");
            setNotice({ type: "success", message });
        } catch (error) {
            setNotice({ type: "error", message: getErrorMessage(error) });
        } finally {
            setBusy(null);
        }
    }

    async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy("reset");
        setNotice(null);

        try {
            const email = resetForm.email.trim();
            const message = await resetPassword({
                email,
                otp: resetForm.otp.trim(),
                newPassword: resetForm.newPassword,
            });

            setResetForm(initialResetPasswordForm);
            setLoginForm({ email, password: "" });
            setMode("login");
            setNotice({ type: "success", message });
        } catch (error) {
            setNotice({ type: "error", message: getErrorMessage(error) });
        } finally {
            setBusy(null);
        }
    }

    async function handleResendResetCode() {
        const email = resetForm.email.trim();

        if (!email) {
            setNotice({
                type: "error",
                message: "Enter your email before requesting a new code.",
            });
            return;
        }

        setBusy("resendReset");
        setNotice(null);

        try {
            const message = await forgotPassword({ email });
            setNotice({ type: "success", message });
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
                            forgotForm={forgotForm}
                            loginForm={loginForm}
                            mode={mode}
                            onForgotPassword={handleForgotPassword}
                            onLogin={handleLogin}
                            onModeChange={changeMode}
                            onRegister={handleRegister}
                            onResendResetCode={handleResendResetCode}
                            onResendVerification={handleResendVerification}
                            onResetPassword={handleResetPassword}
                            onVerifyEmail={handleVerifyEmail}
                            registerForm={registerForm}
                            resetForm={resetForm}
                            setForgotForm={setForgotForm}
                            setLoginForm={setLoginForm}
                            setRegisterForm={setRegisterForm}
                            setResetForm={setResetForm}
                            setVerifyForm={setVerifyForm}
                            verifyForm={verifyForm}
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
    forgotForm,
    loginForm,
    mode,
    onForgotPassword,
    onLogin,
    onModeChange,
    onRegister,
    onResendResetCode,
    onResendVerification,
    onResetPassword,
    onVerifyEmail,
    registerForm,
    resetForm,
    setForgotForm,
    setLoginForm,
    setRegisterForm,
    setResetForm,
    setVerifyForm,
    verifyForm,
}: {
    busy: BusyState;
    forgotForm: typeof initialForgotPasswordForm;
    loginForm: typeof initialLoginForm;
    mode: AuthMode;
    onForgotPassword: (event: FormEvent<HTMLFormElement>) => void;
    onLogin: (event: FormEvent<HTMLFormElement>) => void;
    onModeChange: (mode: AuthMode) => void;
    onRegister: (event: FormEvent<HTMLFormElement>) => void;
    onResendResetCode: () => void;
    onResendVerification: () => void;
    onResetPassword: (event: FormEvent<HTMLFormElement>) => void;
    onVerifyEmail: (event: FormEvent<HTMLFormElement>) => void;
    registerForm: typeof initialRegisterForm;
    resetForm: typeof initialResetPasswordForm;
    setForgotForm: (value: typeof initialForgotPasswordForm) => void;
    setLoginForm: (value: typeof initialLoginForm) => void;
    setRegisterForm: (value: typeof initialRegisterForm) => void;
    setResetForm: (value: typeof initialResetPasswordForm) => void;
    setVerifyForm: (value: typeof initialEmailOtpForm) => void;
    verifyForm: typeof initialEmailOtpForm;
}) {
    const showTabs = mode === "login" || mode === "register";

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-7">
            {/* Header */}
            {mode === "verify" ? (
                <div className="mb-6">
                    <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => onModeChange("register")}
                        className="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="currentColor"><path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" /></svg>
                        Back to register
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50">
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" /><path d="m22 6-10 7L2 6" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold leading-tight text-emerald-700 sm:text-[1.75rem]">
                                Email Verification
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Enter the code sent to <span className="font-medium text-slate-700">{verifyForm.email}</span>
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-6">
                    <h2 className="text-3xl font-semibold leading-tight text-emerald-700 sm:text-[2rem]">
                        {getModeTitle(mode)}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {getModeDescription(mode)}
                    </p>
                </div>
            )}

            {/* Tab bar — only for login / register */}
            {showTabs ? (
                <div
                    className="mb-6 grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-50 p-1"
                    role="tablist"
                    aria-label="Choose authentication mode"
                >
                    {primaryModes.map((item) => (
                        <button
                            key={item}
                            type="button"
                            role="tab"
                            disabled={Boolean(busy)}
                            aria-selected={mode === item}
                            className={tabClassName(mode === item)}
                            onClick={() => onModeChange(item)}
                        >
                            {getModeTabLabel(item)}
                        </button>
                    ))}
                </div>
            ) : null}

            {mode === "login" ? (
                <LoginForm
                    busy={busy}
                    form={loginForm}
                    onForgotPassword={() => onModeChange("forgot")}
                    onSubmit={onLogin}
                    setForm={setLoginForm}
                />
            ) : null}

            {mode === "register" ? (
                <RegisterForm
                    busy={busy}
                    form={registerForm}
                    onSubmit={onRegister}
                    setForm={setRegisterForm}
                />
            ) : null}

            {mode === "verify" ? (
                <VerifyEmailForm
                    busy={busy}
                    form={verifyForm}
                    onResend={onResendVerification}
                    onSubmit={onVerifyEmail}
                    setForm={setVerifyForm}
                />
            ) : null}

            {mode === "forgot" ? (
                <ForgotPasswordForm
                    busy={busy}
                    form={forgotForm}
                    onBack={() => onModeChange("login")}
                    onSubmit={onForgotPassword}
                    setForm={setForgotForm}
                />
            ) : null}

            {mode === "reset" ? (
                <ResetPasswordForm
                    busy={busy}
                    form={resetForm}
                    onBack={() => onModeChange("login")}
                    onResend={onResendResetCode}
                    onSubmit={onResetPassword}
                    setForm={setResetForm}
                />
            ) : null}
        </div>
    );
}

function LoginForm({
    busy,
    form,
    onForgotPassword,
    onSubmit,
    setForm,
}: {
    busy: BusyState;
    form: typeof initialLoginForm;
    onForgotPassword: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setForm: (value: typeof initialLoginForm) => void;
}) {
    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            <TextField
                autoComplete="email"
                label="Email"
                name="email"
                onChange={(value) => setForm({ ...form, email: value })}
                placeholder="you@example.com"
                required
                type="email"
                value={form.email}
            />
            <TextField
                autoComplete="current-password"
                label="Password"
                name="password"
                onChange={(value) => setForm({ ...form, password: value })}
                placeholder="Enter your password"
                required
                type="password"
                value={form.password}
            />
            <div className="flex justify-end">
                <button
                    type="button"
                    disabled={Boolean(busy)}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 disabled:cursor-not-allowed disabled:text-slate-400"
                    onClick={onForgotPassword}
                >
                    Forgot password?
                </button>
            </div>
            <SubmitButton busy={busy === "login"} label="Sign in" />
        </form>
    );
}

function RegisterForm({
    busy,
    form,
    onSubmit,
    setForm,
}: {
    busy: BusyState;
    form: typeof initialRegisterForm;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setForm: (value: typeof initialRegisterForm) => void;
}) {
    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            <TextField
                autoComplete="name"
                label="Full name"
                maxLength={50}
                name="fullName"
                onChange={(value) => setForm({ ...form, fullName: value })}
                required
                value={form.fullName}
            />
            <TextField
                autoComplete="email"
                label="Email"
                maxLength={50}
                name="registerEmail"
                onChange={(value) => setForm({ ...form, email: value })}
                placeholder="you@example.com"
                required
                type="email"
                value={form.email}
            />
            <TextField
                autoComplete="new-password"
                label="Password"
                maxLength={100}
                minLength={8}
                name="registerPassword"
                onChange={(value) => setForm({ ...form, password: value })}
                required
                type="password"
                value={form.password}
            />
            <TextField
                autoComplete="tel"
                label="Phone number"
                maxLength={20}
                name="phone"
                onChange={(value) => setForm({ ...form, phone: value })}
                type="tel"
                value={form.phone}
            />

            <fieldset disabled={Boolean(busy)}>
                <legend className="mb-2 block text-sm font-medium text-slate-700">
                    Role
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                    {roleOptions.map((option) => {
                        const checked = form.role === option.value;

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
                                        setForm({
                                            ...form,
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

            <SubmitButton busy={busy === "register"} label="Create account" />
        </form>
    );
}

function VerifyEmailForm({
    busy,
    form,
    onResend,
    onSubmit,
    setForm,
}: {
    busy: BusyState;
    form: typeof initialEmailOtpForm;
    onResend: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setForm: (value: typeof initialEmailOtpForm) => void;
}) {
    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            {/* Email field (read-only, pre-filled from register) */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                </label>
                <div className="flex h-11 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    {form.email}
                </div>
            </div>
            <TextField
                autoComplete="one-time-code"
                inputMode="numeric"
                label="Verification code"
                maxLength={6}
                name="verifyOtp"
                onChange={(value) => setForm({ ...form, otp: value })}
                placeholder="000000"
                required
                value={form.otp}
            />
            <div className="flex justify-end">
                <button
                    type="button"
                    disabled={Boolean(busy)}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 disabled:cursor-not-allowed disabled:text-slate-400"
                    onClick={onResend}
                >
                    {busy === "resendVerification"
                        ? "Sending..."
                        : "Send a new code"}
                </button>
            </div>
            <SubmitButton busy={busy === "verify"} label="Verify email" />
        </form>
    );
}

function ForgotPasswordForm({
    busy,
    form,
    onBack,
    onSubmit,
    setForm,
}: {
    busy: BusyState;
    form: typeof initialForgotPasswordForm;
    onBack: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setForm: (value: typeof initialForgotPasswordForm) => void;
}) {
    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            <TextField
                autoComplete="email"
                label="Email"
                name="forgotEmail"
                onChange={(value) => setForm({ email: value })}
                placeholder="you@example.com"
                required
                type="email"
                value={form.email}
            />
            <SubmitButton busy={busy === "forgot"} label="Send reset code" />
            <BackButton busy={busy} label="Back to sign in" onClick={onBack} />
        </form>
    );
}

function ResetPasswordForm({
    busy,
    form,
    onBack,
    onResend,
    onSubmit,
    setForm,
}: {
    busy: BusyState;
    form: typeof initialResetPasswordForm;
    onBack: () => void;
    onResend: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setForm: (value: typeof initialResetPasswordForm) => void;
}) {
    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            <TextField
                autoComplete="email"
                label="Email"
                name="resetEmail"
                onChange={(value) => setForm({ ...form, email: value })}
                placeholder="you@example.com"
                required
                type="email"
                value={form.email}
            />
            <TextField
                autoComplete="one-time-code"
                inputMode="numeric"
                label="Reset code"
                maxLength={6}
                name="resetOtp"
                onChange={(value) => setForm({ ...form, otp: value })}
                placeholder="000000"
                required
                value={form.otp}
            />
            <TextField
                autoComplete="new-password"
                label="New password"
                minLength={6}
                name="newPassword"
                onChange={(value) => setForm({ ...form, newPassword: value })}
                required
                type="password"
                value={form.newPassword}
            />
            <div className="flex justify-end">
                <button
                    type="button"
                    disabled={Boolean(busy)}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 disabled:cursor-not-allowed disabled:text-slate-400"
                    onClick={onResend}
                >
                    {busy === "resendReset" ? "Sending..." : "Send a new code"}
                </button>
            </div>
            <SubmitButton busy={busy === "reset"} label="Reset password" />
            <BackButton busy={busy} label="Back to sign in" onClick={onBack} />
        </form>
    );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
    return (
        <button
            type="submit"
            disabled={busy}
            className="mt-2 h-11 w-full rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
            {busy ? "Working..." : label}
        </button>
    );
}

function BackButton({
    busy,
    label,
    onClick,
}: {
    busy: BusyState;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={Boolean(busy)}
            onClick={onClick}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400"
        >
            {label}
        </button>
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
    return `h-10 rounded-md px-2 text-sm font-semibold transition disabled:cursor-not-allowed ${
        active
            ? "bg-white text-emerald-800 shadow-sm"
            : "text-slate-500 hover:text-slate-800 disabled:text-slate-400"
    }`;
}

function getModeTitle(mode: AuthMode): string {
    switch (mode) {
        case "register":
            return "Create an account";
        case "verify":
            return "Verify email";
        case "forgot":
            return "Reset access";
        case "reset":
            return "Set new password";
        default:
            return "Sign in";
    }
}

function getModeDescription(mode: AuthMode): string {
    switch (mode) {
        case "register":
            return "Create a requester or volunteer account.";
        case "verify":
            return "Enter the code sent to your email address.";
        case "forgot":
            return "Request a reset code for an active account.";
        case "reset":
            return "Use your reset code to choose a new password.";
        default:
            return "Use a verified account to continue.";
    }
}

function getModeTabLabel(mode: AuthMode): string {
    switch (mode) {
        case "register":
            return "Register";
        case "verify":
            return "Verify";
        default:
            return "Sign in";
    }
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
