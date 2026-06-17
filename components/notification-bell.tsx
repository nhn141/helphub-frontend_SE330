"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

import { useAuth } from "@/components/auth-provider";
import {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    type NotificationResponse,
    type RealtimeNotificationPayload,
} from "@/lib/notification-api";

export function NotificationBell() {
    const { getAccessToken } = useAuth();
    const [notifications, setNotifications] = useState<NotificationResponse[]>(
        [],
    );
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const stompRef = useRef<Client | null>(null);

    // Fetch unread count on mount
    useEffect(() => {
        let cancelled = false;

        async function fetchUnreadCount() {
            try {
                const token = await getAccessToken();
                const res = await getUnreadNotificationCount(token);
                if (!cancelled) {
                    setUnreadCount(res.unreadCount);
                }
            } catch (err) {
                console.error("Failed to fetch unread count", err);
            }
        }

        void fetchUnreadCount();
        return () => {
            cancelled = true;
        };
    }, [getAccessToken]);

    // WebSocket subscription for real-time notifications
    useEffect(() => {
        let client: Client;

        async function connectWebSocket() {
            try {
                const token = await getAccessToken();
                const wsUrl =
                    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081/ws";

                client = new Client({
                    brokerURL: wsUrl,
                    connectHeaders: { Authorization: `Bearer ${token}` },
                    reconnectDelay: 5000,
                });

                client.onConnect = () => {
                    client.subscribe(
                        "/user/queue/notifications",
                        (message) => {
                            try {
                                const payload: RealtimeNotificationPayload =
                                    JSON.parse(message.body);

                                if (
                                    payload.eventType ===
                                    "NOTIFICATION_CREATED"
                                ) {
                                    // Add the new notification to the top of the list
                                    setNotifications((prev) => {
                                        if (
                                            prev.some(
                                                (n) =>
                                                    n.id ===
                                                    payload.notification.id,
                                            )
                                        ) {
                                            return prev;
                                        }
                                        return [payload.notification, ...prev];
                                    });
                                    setUnreadCount(payload.unreadCount);
                                }
                            } catch (e) {
                                console.error(
                                    "Failed to parse notification payload",
                                    e,
                                );
                            }
                        },
                    );
                };

                client.activate();
                stompRef.current = client;
            } catch (err) {
                console.error("Failed to connect notification WebSocket", err);
            }
        }

        void connectWebSocket();

        return () => {
            if (stompRef.current) {
                stompRef.current.deactivate();
            }
        };
    }, [getAccessToken]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch full notification list when dropdown opens
    const handleToggle = useCallback(async () => {
        const nextOpen = !isOpen;
        setIsOpen(nextOpen);

        if (nextOpen) {
            setIsLoading(true);
            try {
                const token = await getAccessToken();
                const data = await getMyNotifications(token);
                setNotifications(data);
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            } finally {
                setIsLoading(false);
            }
        }
    }, [isOpen, getAccessToken]);

    // Mark a single notification as read
    const handleMarkAsRead = useCallback(
        async (notification: NotificationResponse) => {
            if (notification.isRead) return;

            try {
                const token = await getAccessToken();
                const updated = await markNotificationAsRead(
                    token,
                    notification.id,
                );

                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? updated : n)),
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (err) {
                console.error("Failed to mark notification as read", err);
            }
        },
        [getAccessToken],
    );

    const handleNotificationClick = useCallback(
        async (notification: NotificationResponse) => {
            const href = getNotificationHref(notification);

            setIsOpen(false);
            await handleMarkAsRead(notification);

            if (href) {
                navigateWithReload(href);
            }
        },
        [handleMarkAsRead],
    );

    // Mark all notifications as read
    const handleMarkAllAsRead = useCallback(async () => {
        if (unreadCount === 0) return;

        try {
            const token = await getAccessToken();
            await markAllNotificationsAsRead(token);

            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true })),
            );
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    }, [getAccessToken, unreadCount]);

    // Format relative time
    function formatTimeAgo(dateString: string): string {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffSec < 60) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        return date.toLocaleDateString();
    }

    return (
        <div ref={containerRef} className="relative">
            {/* Bell button */}
            <button
                id="notification-bell-button"
                type="button"
                aria-label="Notifications"
                onClick={handleToggle}
                className="relative flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    id="notification-dropdown"
                    className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/8"
                    style={{
                        animation: "notifDropdownIn 0.18s ease-out",
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <h3 className="text-sm font-semibold text-slate-900">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-medium text-emerald-600 transition hover:text-emerald-700"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="size-6 animate-spin rounded-full border-[2.5px] border-slate-200 border-t-emerald-600" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <BellOffIcon />
                                <p className="mt-2 text-sm">
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const href = getNotificationHref(notification);

                                return (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        onClick={() =>
                                            handleNotificationClick(
                                                notification,
                                            )
                                        }
                                        aria-label={
                                            href
                                                ? `Open notification: ${notification.content}`
                                                : `Mark notification as read: ${notification.content}`
                                        }
                                        className={`group flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${
                                            !notification.isRead
                                                ? "bg-emerald-50/40"
                                                : ""
                                        }`}
                                    >
                                        {/* Icon */}
                                        <div
                                            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                                                !notification.isRead
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-slate-100 text-slate-400"
                                            }`}
                                        >
                                            <NotifItemIcon
                                                referenceType={
                                                    notification.referenceType
                                                }
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={`text-sm leading-snug ${
                                                    !notification.isRead
                                                        ? "font-medium text-slate-900"
                                                        : "text-slate-600"
                                                }`}
                                            >
                                                {notification.content}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                {formatTimeAgo(
                                                    notification.createdAt,
                                                )}
                                            </p>
                                        </div>

                                        <span className="mt-1 flex shrink-0 items-center gap-2">
                                            {!notification.isRead && (
                                                <span className="size-2 rounded-full bg-rose-500" />
                                            )}
                                            {href ? <OpenIcon /> : null}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                            <span className="text-xs text-slate-400">
                                {notifications.length} notification
                                {notifications.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Animation keyframes */}
            <style jsx>{`
                @keyframes notifDropdownIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}

function getNotificationHref(
    notification: NotificationResponse,
): string | null {
    const referenceHref = getHrefFromReference(notification);

    if (referenceHref) {
        return referenceHref;
    }

    const actionHref = getHrefFromActionUrl(notification.actionUrl);

    if (actionHref) {
        return actionHref;
    }

    return getDefaultHrefForReferenceType(notification.referenceType);
}

function getHrefFromReference(
    notification: NotificationResponse,
): string | null {
    const referenceId = notification.referenceId?.trim();

    switch (notification.referenceType) {
        case "SUPPORT_REQUEST":
        case "VOLUNTEER_ASSIGNMENT":
        case "SUPPORT_NEED":
        case "CONTRIBUTION":
            return referenceId
                ? `/support-requests/${encodePathSegment(referenceId)}`
                : null;
        default:
            return null;
    }
}

function getDefaultHrefForReferenceType(referenceType: string): string | null {
    switch (referenceType) {
        case "SUPPORT_REQUEST":
        case "VOLUNTEER_ASSIGNMENT":
        case "SUPPORT_NEED":
        case "CONTRIBUTION":
            return "/support-requests";
        case "MESSAGE":
        case "CONVERSATION":
            return "/messages";
        case "REPORT":
            return "/admin/reports";
        case "USER":
            return "/admin/users";
        case "POST":
            return "/social";
        default:
            return null;
    }
}

function navigateWithReload(href: string) {
    const targetUrl = new URL(href, window.location.origin);

    if (
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search
    ) {
        window.location.reload();
        return;
    }

    window.location.assign(`${targetUrl.pathname}${targetUrl.search}`);
}

function getHrefFromActionUrl(actionUrl: string | null): string | null {
    const path = normalizeActionPath(actionUrl);

    if (!path) {
        return null;
    }

    const conversationId = getFirstMatch(path, [
        /^\/conversations\/([^/?#]+)/,
        /^\/api\/v1\/conversations\/([^/?#]+)/,
    ]);

    if (conversationId) {
        return `/messages?conversationId=${encodePathSegment(conversationId)}`;
    }

    const supportRequestId = getFirstMatch(path, [
        /^\/support-requests\/([^/?#]+)/,
        /^\/api\/v1\/support-requests\/([^/?#]+)/,
    ]);

    if (supportRequestId) {
        return `/support-requests/${encodePathSegment(supportRequestId)}`;
    }

    const reportId = getFirstMatch(path, [
        /^\/reports\/([^/?#]+)/,
        /^\/api\/reports\/([^/?#]+)/,
        /^\/api\/v1\/reports\/([^/?#]+)/,
    ]);

    if (reportId) {
        return `/admin/reports?reportId=${encodePathSegment(reportId)}`;
    }

    const userId = getFirstMatch(path, [
        /^\/users\/([^/?#]+)/,
        /^\/api\/v1\/users\/([^/?#]+)/,
    ]);

    if (userId) {
        return `/admin/users?userId=${encodePathSegment(userId)}`;
    }

    const postId = getFirstMatch(path, [
        /^\/posts\/([^/?#]+)/,
        /^\/api\/v1\/posts\/([^/?#]+)/,
    ]);

    if (postId) {
        return `/social?postId=${encodePathSegment(postId)}`;
    }

    return getSupportedInternalHref(path);
}

function normalizeActionPath(actionUrl: string | null): string | null {
    if (!actionUrl?.trim()) {
        return null;
    }

    try {
        const baseUrl =
            typeof window === "undefined"
                ? "http://helphub.local"
                : window.location.origin;
        const parsed = new URL(actionUrl, baseUrl);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return actionUrl.startsWith("/") ? actionUrl : `/${actionUrl}`;
    }
}

function getFirstMatch(path: string, patterns: RegExp[]): string | null {
    for (const pattern of patterns) {
        const match = path.match(pattern);

        if (match?.[1]) {
            return match[1];
        }
    }

    return null;
}

function getSupportedInternalHref(path: string): string | null {
    const supportedPaths = [
        "/dashboard",
        "/support-requests",
        "/messages",
        "/social",
        "/admin/dashboard",
        "/admin/users",
        "/admin/support-requests",
        "/admin/reports",
        "/admin/categories",
        "/admin/support-locations",
        "/admin/role-upgrades",
    ];

    return supportedPaths.some(
        (supportedPath) =>
            path === supportedPath || path.startsWith(`${supportedPath}?`),
    )
        ? path
        : null;
}

function encodePathSegment(value: string): string {
    try {
        return encodeURIComponent(decodeURIComponent(value));
    } catch {
        return encodeURIComponent(value);
    }
}

// ── Icons ────────────────────────────────────────────────────────────

function BellIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}

function BellOffIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-10 text-slate-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}

function OpenIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4 shrink-0 text-slate-300 transition group-hover:text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}

function NotifItemIcon({ referenceType }: { referenceType: string }) {
    switch (referenceType) {
        case "SUPPORT_REQUEST":
            return (
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <path
                        d="M12 21s-8-4.7-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.3-8 11-8 11Z"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case "VOLUNTEER_ASSIGNMENT":
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            );
        case "CONTRIBUTION":
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
                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
            );
        default:
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
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
            );
    }
}
