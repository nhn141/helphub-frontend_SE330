"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { Notice, LoadingBlock } from "@/components/support-ui";

const adminNavigation = [
    { href: "/admin/dashboard", label: "Dashboard", icon: DashboardIcon },
    { href: "/admin/users", label: "Users Management", icon: UsersIcon },
    {
        href: "/admin/support-requests",
        label: "Support Requests",
        icon: RequestIcon,
    },
    {
        href: "/admin/reports",
        label: "Reports Moderation",
        icon: ShieldAlertIcon,
    },
    { href: "/admin/categories", label: "Categories", icon: FolderIcon },
    {
        href: "/admin/support-locations",
        label: "Support Locations",
        icon: MapPinIcon,
    },
    {
        href: "/admin/role-upgrades",
        label: "Upgrade Requests",
        icon: ArrowUpCircleIcon,
    },
    {
        href: "/admin/community-funds",
        label: "Community Funds",
        icon: WalletIcon,
    },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { profile, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!profile || profile.role !== "ADMIN") {
            router.replace("/dashboard");
        }
    }, [profile, router]);

    if (!profile || profile.role !== "ADMIN") {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-[#f4f6f2] p-4">
                <Notice type="error">
                    Access Denied. You do not have permission to access the
                    administration panel.
                </Notice>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-[#f4f6f2] text-slate-950">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-[#10261f] text-white lg:flex lg:flex-col">
                <AdminSidebarContent
                    pathname={pathname}
                    profileName={profile.fullName}
                    onLogout={logout}
                />
            </aside>

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-950/45"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-[#10261f] text-white shadow-2xl">
                        <AdminSidebarContent
                            pathname={pathname}
                            profileName={profile.fullName}
                            onNavigate={() => setMobileMenuOpen(false)}
                            onLogout={logout}
                        />
                    </aside>
                </div>
            )}

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
                        >
                            <MenuIcon />
                        </button>
                        <div>
                            <p className="text-sm font-semibold text-slate-950">
                                HelpHub Admin Control Panel
                            </p>
                            <p className="hidden text-xs text-slate-500 sm:block">
                                System-wide monitoring & resource moderation
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-block rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-500/20">
                            System Admin
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                            {profile.fullName
                                .split(" ")
                                .slice(-1)[0]
                                ?.charAt(0)
                                .toUpperCase() || "A"}
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function AdminSidebarContent({
    pathname,
    profileName,
    onNavigate,
    onLogout,
}: {
    pathname: string;
    profileName: string;
    onNavigate?: () => void;
    onLogout: () => void;
}) {
    return (
        <>
            <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-lg font-black text-[#10261f]">
                    A
                </div>
                <div>
                    <p className="text-lg font-bold tracking-tight">
                        HelpHub Admin
                    </p>
                    <p className="text-xs text-amber-200/70">
                        Management workspace
                    </p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {adminNavigation.map((item) => {
                    const active =
                        pathname === item.href ||
                        (item.href !== "/admin/dashboard" &&
                            pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex h-10 items-center gap-3 rounded-xl px-3 text-xs font-medium transition ${
                                active
                                    ? "bg-amber-400 text-[#10261f] font-semibold"
                                    : "text-white/70 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            <Icon />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/10 p-4">
                <div className="rounded-xl bg-white/5 p-3">
                    <p className="truncate text-xs font-semibold">
                        {profileName}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-white/55">
                        System Administrator
                    </p>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-xs font-semibold text-white/75 hover:bg-white/5 hover:text-white"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </>
    );
}

function DashboardIcon() {
    return (
        <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
        </svg>
    );
}

function RequestIcon() {
    return (
        <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
        </svg>
    );
}

function ShieldAlertIcon() {
    return (
        <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
        </svg>
    );
}

function FolderIcon() {
    return (
        <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
        </svg>
    );
}

function MapPinIcon() {
    return (
        <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
    );
}

function ArrowUpCircleIcon() {
    return (
        <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"
            />
        </svg>
    );
}

function WalletIcon() {
    return (
        <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 17h16"
            />
        </svg>
    );
}
