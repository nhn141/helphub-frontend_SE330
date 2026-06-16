import { PageResponse } from "./admin-api";
import { apiData } from "./api";

export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
export type ConversationType = "PRIVATE" | "GROUP" | "COMMUNITY";
export interface MessageMediaResponse {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
    altText: string | null;
}
export interface MessageResponse {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl: string | null;
    content: string;
    media: MessageMediaResponse[];
    createdAt: string;
    updatedAt: string;
    editedAt: string | null;
}

export interface ConversationMemberResponse {
    userId: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    joinedAt: string;
}

export interface ConversationSummaryResponse {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    type: ConversationType;
    members: ConversationMemberResponse[];
    lastMessage?: MessageResponse | null;
    unreadCount: number;
    updatedAt: string;
}
export interface CreateMediaPayload {
    fileName: string;
    fileUrl: string;
    fileType: "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";
    mimeType: string;
    fileSize: number;
    altText: string | null;
    isPublic: boolean;
}

export interface SendMessageRequest {
    content: string;
    mediaIds?: string[];
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
    userId: string,
): Promise<ConversationSummaryResponse> {
    return apiData<ConversationSummaryResponse>(
        `/api/v1/conversations/private`,
        {
            method: "POST",
            body: JSON.stringify({ receiverId: userId }),
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
): Promise<MessageResponse[]> {
    return apiData<MessageResponse[]>(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
        { method: "GET" },
        accessToken,
    );
}

export function sendMessage(
    accessToken: string,
    conversationId: string,
    payload: SendMessageRequest,
): Promise<MessageResponse> {
    return apiData<MessageResponse>(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function createPrivateConversationByEmail(
    accessToken: string,
    email: string,
): Promise<ConversationSummaryResponse> {
    return apiData<ConversationSummaryResponse>(
        `/api/v1/conversations/private/by-email`,
        {
            method: "POST",
            body: JSON.stringify({ receiverEmail: email.trim() }),
        },
        accessToken,
    );
}

export function markMessageAsRead(
    accessToken: string,
    conversationId: string,
    messageId: string,
): Promise<void> {
    return apiData<void>(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/read`,
        { method: "PATCH" },
        accessToken,
    );
}

export function createMediaRecord(
    accessToken: string,
    payload: CreateMediaPayload,
): Promise<{ id: string }> {
    return apiData<{ id: string }>(
        "/api/v1/media",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}
