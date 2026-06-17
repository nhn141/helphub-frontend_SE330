"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";
import { NotificationBell } from "@/components/notification-bell";
import type { UserRole } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/support-request-ui";

type NavigationItem = {
    href: string;
    label: string;
    icon: () => ReactNode;
    roles?: UserRole[];
};

const navigation: NavigationItem[] = [
    {
        href: "/dashboard",
        label: "Overview",
        icon: HomeIcon,
    },
    {
        href: "/support-requests",
        label: "Support requests",
        icon: SupportIcon,
    },
    {
        href: "/support-locations",
        label: "Support locations",
        icon: LocationHubIcon,
        roles: ["ADMIN", "COLLABORATOR"],
    },
    {
        href: "/social",
        label: "Community Feed",
        icon: UsersIcon,
    },
    {
        href: "/messages",
        label: "Messages",
        icon: MessageIcon,
    },
];

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { profile, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-dvh bg-[#f4f6f2] text-slate-950">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-[#10261f] text-white lg:flex lg:flex-col">
                <SidebarContent
                    pathname={pathname}
                    profileName={profile.fullName}
                    profileRole={ROLE_LABELS[profile.role]}
                    profileRoleValue={profile.role}
                    onLogout={logout}
                />
            </aside>

            {mobileMenuOpen ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Close menu"
                        className="absolute inset-0 bg-slate-950/45"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-[#10261f] text-white shadow-2xl">
                        <SidebarContent
                            pathname={pathname}
                            profileName={profile.fullName}
                            profileRole={ROLE_LABELS[profile.role]}
                            profileRoleValue={profile.role}
                            onNavigate={() => setMobileMenuOpen(false)}
                            onLogout={logout}
                        />
                    </aside>
                </div>
            ) : null}

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Open menu"
                            onClick={() => setMobileMenuOpen(true)}
                            className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
                        >
                            <MenuIcon />
                        </button>
                        <div>
                            <p className="text-sm font-semibold text-slate-950">
                                {getPageTitle(pathname)}
                            </p>
                            <p className="hidden text-xs text-slate-500 sm:block">
                                Transparent support matched to real needs
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {profile.role === "REQUESTER" ? (
                            <Link
                                href="/support-requests/new"
                                className="hidden h-9 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 sm:flex"
                            >
                                <PlusIcon />
                                Create request
                            </Link>
                        ) : null}
                        <NotificationBell />
                        <Link
                            href="/profile"
                            className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 hover:bg-emerald-200 transition"
                        >
                            {getInitials(profile.fullName)}
                        </Link>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function SidebarContent({
    pathname,
    profileName,
    profileRole,
    profileRoleValue,
    onNavigate,
    onLogout,
}: {
    pathname: string;
    profileName: string;
    profileRole: string;
    profileRoleValue: UserRole;
    onNavigate?: () => void;
    onLogout: () => void;
}) {
    return (
        <>
            <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-400 text-lg font-black text-[#10261f]">
                    H
                </div>
                <div>
                    <p className="text-lg font-bold tracking-tight">HelpHub</p>
                    <p className="text-xs text-emerald-100/70">
                        Support coordination portal
                    </p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-6">
                {navigation
                    .filter(
                        (item) =>
                            !item.roles ||
                            item.roles.includes(profileRoleValue),
                    )
                    .map((item) => {
                        const active =
                            pathname === item.href ||
                            (item.href !== "/dashboard" &&
                                pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                                    active
                                        ? "bg-emerald-400 text-[#10261f]"
                                        : "text-white/70 hover:bg-white/8 hover:text-white"
                                }`}
                            >
                                <Icon />
                                {item.label}
                            </Link>
                        );
                    })}
            </nav>

            <div className="border-t border-white/10 p-4">
                <div className="rounded-xl bg-white/6 p-3">
                    <p className="truncate text-sm font-semibold">
                        {profileName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/55">
                        {profileRole}
                    </p>
                    <Link
                        href="/profile"
                        onClick={onNavigate}
                        className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/10 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
                    >
                        <UserIcon />
                        Profile
                    </Link>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/12 text-xs font-semibold text-white/75 hover:bg-white/8 hover:text-white transition"
                    >
                        <LogoutIcon />
                        Sign out
                    </button>
                </div>
            </div>
        </>
    );
}

function getPageTitle(pathname: string): string {
    if (pathname === "/support-requests/new") {
        return "Create support request";
    }

    if (pathname.includes("/edit")) {
        return "Edit request";
    }

    if (pathname.startsWith("/support-requests/")) {
        return "Request details";
    }

    if (pathname.startsWith("/support-requests")) {
        return "Support requests";
    }

    if (pathname.startsWith("/support-locations")) {
        return "Support locations";
    }

    if (pathname.startsWith("/social")) {
        return "Community Feed";
    }

    if (pathname.startsWith("/messages")) {
        return "Messages";
    }

    if (pathname.startsWith("/profile")) {
        return "User Profile";
    }

    return "Overview";
}

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function HomeIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <path
                d="m3 10 9-7 9 7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M5 9.5V21h14V9.5M9 21v-7h6v7" strokeLinejoin="round" />
        </svg>
    );
}

function SupportIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <path
                d="M12 21s-8-4.7-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.3-8 11-8 11Z"
                strokeLinejoin="round"
            />
            <path d="M8.5 12h7M12 8.5v7" strokeLinecap="round" />
        </svg>
    );
}

function LocationHubIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 21s6-5.4 6-11a6 6 0 0 0-12 0c0 5.6 6 11 6 11Z" />
            <circle cx="12" cy="10" r="2.3" />
            <path d="M5 21h14" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function MessageIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        >
            <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="14" cy="7" r="4" />
        </svg>
    );
}
