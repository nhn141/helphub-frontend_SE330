import { PageResponse } from "./admin-api";
import { apiData } from "./api";

export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
export type ConversationType = "PRIVATE" | "GROUP" | "COMMUNITY";

export interface MessageResponse {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string | null;
    content: string;
    type: MessageType;
    mediaUrls: string[] | null;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationSummaryResponse {
    id: string;
    name: string;
    avatarUrl: string | null;
    type: ConversationType;
    lastMessage: MessageResponse | null;
    unreadCount: number;
    updatedAt: string;
}

export interface SendMessageRequest {
    conversationId: string;
    content: string;
    mediaUrls?: string[];
}

export function getMyConversations(
    accessToken: string,
): Promise<ConversationSummaryResponse[]> {
    return apiData<ConversationSummaryResponse[]>(
        `/api/v1/conversations/me`,
        { method: "GET" },
        accessToken,
    );
}

export function getOrCreatePrivateConversation(
    accessToken: string,
    targetUserId: string,
): Promise<ConversationSummaryResponse> {
    return apiData<ConversationSummaryResponse>(
        `/api/v1/conversations/private`,
        {
            method: "POST",
            body: JSON.stringify({ targetUserId: targetUserId }),
        },
        accessToken,
    );
}

export function markConversationAsRead(
    accessToken: string,
    conversationId: string,
): Promise<void> {
    return apiData<void>(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/read`,
        { method: "PATCH" },
        accessToken,
    );
}

export function getConversationMessages(
    accessToken: string,
    conversationId: string,
    page: number = 0,
    size: number = 30,
): Promise<PageResponse<MessageResponse>> {
    return apiData<PageResponse<MessageResponse>>(
        `/api/v1/messages/conversation/${encodeURIComponent(conversationId)}?page=${page}&size=${size}`,
        { method: "GET" },
        accessToken,
    );
}
