import { apiData } from "./api";

export type PostVisibility = "PUBLIC" | "VOLUNTEERS_ONLY";
export type PostStatus = "ACTIVE" | "UNDER_REVIEW" | "HIDDEN" | "REMOVED";
export type PostReactionType = "LIKE" | "LOVE" | "CARE" | "SAD" | "WOW";
export type MediaFileType = "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";

export type PostSummaryResponse = {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    supportRequestId: string | null;
    supportRequestTitle: string | null;
    content: string;
    visibility: PostVisibility;
    status: PostStatus;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type SocialPost = PostSummaryResponse & {
    media?: PostMedia[];
    comments?: PostComment[];
    reactionCount?: ReactionCount;
    myReaction?: PostReactionType | null;
};

export type PostPayload = {
    content: string;
    visibility: PostVisibility;
    supportRequestId?: string | null;
};

export type PostMedia = {
    id: string;
    postId: string;
    mediaId: string;
    fileName: string;
    fileUrl: string;
    fileType: MediaFileType;
    mimeType: string;
    displayOrder: number;
};

export type CreateMediaPayload = {
    fileName: string;
    fileUrl: string;
    fileType: MediaFileType;
    mimeType: string;
    fileSize: number;
    altText: string | null;
    isPublic: boolean;
};

export type AttachMediaPayload = {
    mediaId: string;
    displayOrder: number;
};

export type PostComment = {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    content: string;
    parentCommentId: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ReactionCount = {
    postId: string;
    totalCount: number;
    countByType: Record<PostReactionType, number>;
};

export function getPosts(accessToken: string): Promise<PostSummaryResponse[]> {
    return apiData<PostSummaryResponse[]>(
        "/api/posts",
        { method: "GET" },
        accessToken,
    );
}

export function createPost(
    accessToken: string,
    payload: PostPayload,
): Promise<PostSummaryResponse> {
    return apiData<PostSummaryResponse>(
        "/api/posts",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export async function deletePost(
    accessToken: string,
    postId: string,
): Promise<void> {
    await apiData<null>(
        `/api/posts/${encodeURIComponent(postId)}`,
        { method: "DELETE" },
        accessToken,
    );
}

export function getPostMedia(
    accessToken: string,
    postId: string,
): Promise<PostMedia[]> {
    return apiData<PostMedia[]>(
        `/api/v1/posts/${encodeURIComponent(postId)}/media`,
        { method: "GET" },
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

export function attachMediaToPost(
    accessToken: string,
    postId: string,
    payload: AttachMediaPayload,
): Promise<void> {
    return apiData<void>(
        `/api/v1/posts/${encodeURIComponent(postId)}/media`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function getReactionCount(
    accessToken: string,
    postId: string,
): Promise<ReactionCount> {
    return apiData<ReactionCount>(
        `/api/v1/posts/${encodeURIComponent(postId)}/reactions/count`,
        { method: "GET" },
        accessToken,
    );
}

export async function getMyReaction(
    accessToken: string,
    postId: string,
): Promise<{ type: PostReactionType } | null> {
    try {
        return await apiData<{ type: PostReactionType }>(
            `/api/v1/posts/${encodeURIComponent(postId)}/reactions/me`,
            { method: "GET" },
            accessToken,
        );
    } catch (error: any) {
        if (error.status === 404) return null;
        throw error;
    }
}

export function reactToPost(
    accessToken: string,
    postId: string,
    type: PostReactionType,
): Promise<void> {
    return apiData<void>(
        `/api/v1/posts/${encodeURIComponent(postId)}/reactions`,
        {
            method: "POST",
            body: JSON.stringify({ type }),
        },
        accessToken,
    );
}

export function removeReaction(
    accessToken: string,
    postId: string,
): Promise<void> {
    return apiData<void>(
        `/api/v1/posts/${encodeURIComponent(postId)}/reactions`,
        { method: "DELETE" },
        accessToken,
    );
}

export function updateReaction(
    accessToken: string,
    postId: string,
    type: PostReactionType,
): Promise<void> {
    return apiData<void>(
        `/api/v1/posts/${encodeURIComponent(postId)}/reactions`,
        {
            method: "PATCH",
            body: JSON.stringify({ type }),
        },
        accessToken,
    );
}

export function getPostComments(
    accessToken: string,
    postId: string,
): Promise<PostComment[]> {
    return apiData<PostComment[]>(
        `/api/v1/posts/${encodeURIComponent(postId)}/comments`,
        { method: "GET" },
        accessToken,
    );
}

export function createPostComment(
    accessToken: string,
    postId: string,
    payload: { content: string; parentCommentId: string | null },
): Promise<PostComment> {
    return apiData<PostComment>(
        `/api/v1/posts/${encodeURIComponent(postId)}/comments`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function deletePostComment(
    accessToken: string,
    commentId: string,
): Promise<void> {
    return apiData<void>(
        `/api/v1/comments/${encodeURIComponent(commentId)}`,
        { method: "DELETE" },
        accessToken,
    );
}

export function updatePost(
    accessToken: string,
    postId: string,
    payload: PostPayload,
): Promise<PostSummaryResponse> {
    return apiData<PostSummaryResponse>(
        `/api/posts/${encodeURIComponent(postId)}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function updatePostComment(
    accessToken: string,
    commentId: string,
    payload: { content: string },
): Promise<PostComment> {
    return apiData<PostComment>(
        `/api/v1/comments/${encodeURIComponent(commentId)}`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}
