import { apiData } from "./api";

export type NotificationResponse = {
    id: string;
    content: string;
    referenceType: string;
    referenceId: string;
    actionUrl: string | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
};

export type UnreadNotificationCountResponse = {
    unreadCount: number;
};

export type RealtimeNotificationPayload = {
    eventType: string;
    notification: NotificationResponse;
    unreadCount: number;
};

export function getMyNotifications(
    accessToken: string,
): Promise<NotificationResponse[]> {
    return apiData<NotificationResponse[]>(
        "/api/v1/notifications",
        { method: "GET" },
        accessToken,
    );
}

export function getUnreadNotificationCount(
    accessToken: string,
): Promise<UnreadNotificationCountResponse> {
    return apiData<UnreadNotificationCountResponse>(
        "/api/v1/notifications/unread-count",
        { method: "GET" },
        accessToken,
    );
}

export function markNotificationAsRead(
    accessToken: string,
    notificationId: string,
): Promise<NotificationResponse> {
    return apiData<NotificationResponse>(
        `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
        { method: "PATCH" },
        accessToken,
    );
}

export function markAllNotificationsAsRead(
    accessToken: string,
): Promise<void> {
    return apiData<void>(
        "/api/v1/notifications/read-all",
        { method: "PATCH" },
        accessToken,
    );
}
