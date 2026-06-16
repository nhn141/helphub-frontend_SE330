"use client";

import { useEffect, useState } from "react";
import {
    PostSummaryResponse,
    PostMedia,
    ReactionCount,
    PostReactionType,
    getPostMedia,
    getReactionCount,
    getMyReaction,
    reactToPost,
    removeReaction,
    deletePost,
    PostVisibility,
    updatePost,
} from "@/lib/social-api";
import { SocialCommentSection } from "./social_comment_section";
import { useAuth } from "../auth-provider";
import { ReportModal } from "../report-modal";

interface SocialPostCardProps {
    post: PostSummaryResponse;
    accessToken: string;
    onDelete?: () => void;
}

export function SocialPostCard({
    post,
    accessToken,
    onDelete,
}: SocialPostCardProps) {
    const { profile } = useAuth();
    const [media, setMedia] = useState<PostMedia[]>([]);
    const [reactionCount, setReactionCount] = useState<ReactionCount | null>(
        null,
    );
    const [myReaction, setMyReaction] = useState<PostReactionType | null>(null);
    const [showComments, setShowComments] = useState(false);

    const [isLoadingExtras, setIsLoadingExtras] = useState(true);
    const [isReacting, setIsReacting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [editVisibility, setEditVisibility] = useState<PostVisibility>(
        post.visibility,
    );
    const [isUpdating, setIsUpdating] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const isAuthor = profile?.id === post.authorId;

    useEffect(() => {
        let isMounted = true;

        async function fetchExtraData() {
            if (!accessToken) return;
            try {
                const [mediaData, reactionData, myReactionData] =
                    await Promise.all([
                        getPostMedia(accessToken, post.id).catch(() => []),
                        getReactionCount(accessToken, post.id).catch(
                            () => null,
                        ),
                        getMyReaction(accessToken, post.id).catch(() => null),
                    ]);

                if (isMounted) {
                    setMedia(mediaData);
                    setReactionCount(reactionData);
                    setMyReaction(myReactionData ? myReactionData.type : null);
                }
            } catch (error) {
                console.error("Failed to fetch post extras:", error);
            } finally {
                if (isMounted) setIsLoadingExtras(false);
            }
        }

        fetchExtraData();

        return () => {
            isMounted = false;
        };
    }, [post.id, accessToken]);

    const toggleReaction = async () => {
        if (isReacting) return;

        setIsReacting(true);

        const previousReaction = myReaction;
        const previousCount = reactionCount?.totalCount || 0;

        try {
            if (myReaction) {
                setMyReaction(null);
                setReactionCount((prev) =>
                    prev
                        ? {
                              ...prev,
                              totalCount: Math.max(0, prev.totalCount - 1),
                          }
                        : null,
                );

                await removeReaction(accessToken, post.id);
            } else {
                setMyReaction("LIKE");
                setReactionCount((prev) =>
                    prev
                        ? { ...prev, totalCount: prev.totalCount + 1 }
                        : {
                              postId: post.id,
                              totalCount: 1,
                              countByType: {
                                  LIKE: 1,
                                  LOVE: 0,
                                  CARE: 0,
                                  SAD: 0,
                                  WOW: 0,
                              },
                          },
                );

                await reactToPost(accessToken, post.id, "LIKE");
            }
        } catch (error) {
            console.error("Reaction failed:", error);
            setMyReaction(previousReaction);
            if (reactionCount) {
                setReactionCount({
                    ...reactionCount,
                    totalCount: previousCount,
                });
            }
        } finally {
            setIsReacting(false);
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this post?",
        );
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            await deletePost(accessToken, post.id);
            if (onDelete) onDelete();
        } catch (error: any) {
            console.error("Failed to delete post:", error);
            alert("Failed to delete post. Please try again.");
            setIsDeleting(false);
        }
    };

    const handleUpdate = async () => {
        if (
            !editContent.trim() ||
            (editContent === post.content && editVisibility === post.visibility)
        ) {
            setIsEditing(false);
            return;
        }

        setIsUpdating(true);
        try {
            await updatePost(accessToken, post.id, {
                content: editContent.trim(),
                visibility: editVisibility,
                supportRequestId: post.supportRequestId,
            });

            if (onDelete) onDelete();
            setIsEditing(false);
        } catch (error: any) {
            console.error("Failed to update post:", error);
            alert("Failed to update post. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {post.authorAvatarUrl ? (
                        <img
                            src={post.authorAvatarUrl}
                            alt={post.authorName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-emerald-800 font-bold text-sm">
                            {post.authorName.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900">
                        {post.authorName}
                    </h4>
                    <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}{" "}
                        •{" "}
                        {post.visibility === "PUBLIC" ? "Public" : "Volunteers"}
                    </p>
                </div>

                {isAuthor ? (
                    <>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            disabled={isDeleting || isUpdating}
                            title="Edit post"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition disabled:opacity-50"
                        >
                            <EditIcon />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting || isUpdating}
                            title="Delete post"
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition disabled:opacity-50"
                        >
                            <TrashIcon />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        title="Report post"
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
                    >
                        <FlagIcon />
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="mb-3 space-y-2">
                    <textarea
                        className="w-full p-3 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white resize-none"
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        disabled={isUpdating}
                    />
                    <div className="flex items-center justify-between">
                        <select
                            value={editVisibility}
                            onChange={(e) =>
                                setEditVisibility(
                                    e.target.value as PostVisibility,
                                )
                            }
                            disabled={isUpdating}
                            className="text-xs border-gray-300 rounded-md text-gray-700 bg-white shadow-sm py-1.5 pl-2 pr-6"
                        >
                            <option value="PUBLIC">Public</option>
                            <option value="VOLUNTEERS_ONLY">
                                Volunteers Only
                            </option>
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(post.content);
                                    setEditVisibility(post.visibility);
                                }}
                                disabled={isUpdating}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating || !editContent.trim()}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                            >
                                {isUpdating ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-gray-800 whitespace-pre-wrap mb-3">
                    {post.content}
                </p>
            )}

            {post.supportRequestId &&
                post.supportRequestTitle &&
                !isEditing && (
                    <div className="mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <LinkIcon />
                            Campaign: {post.supportRequestTitle}
                        </span>
                    </div>
                )}

            {isLoadingExtras ? (
                <div className="animate-pulse h-8 bg-gray-50 rounded-md mb-3 w-1/3"></div>
            ) : (
                media.length > 0 && (
                    <div
                        className={`grid gap-2 mb-3 ${
                            media.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        }`}
                    >
                        {media.map((item, index) => {
                            let imgClass =
                                "w-full object-contain bg-slate-50 transition duration-300 hover:opacity-90 cursor-pointer rounded-xl border border-slate-100 ";

                            if (media.length === 1) {
                                imgClass += "h-auto max-h-[500px]";
                            } else {
                                imgClass += "h-56";
                            }

                            return (
                                <img
                                    key={
                                        item.id
                                            ? `${item.id}-${index}`
                                            : `media-${index}`
                                    }
                                    src={item.fileUrl}
                                    alt={
                                        item.fileName ||
                                        `Post attached image ${index + 1}`
                                    }
                                    className={imgClass}
                                    loading="lazy"
                                />
                            );
                        })}
                    </div>
                )
            )}

            <div className="pt-3 border-t text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                        <span className="text-white text-[10px]">👍</span>
                    </div>
                    <span>{reactionCount?.totalCount || 0}</span>
                </div>

                <div className="flex gap-1 border-t pt-2">
                    <button
                        onClick={toggleReaction}
                        disabled={isReacting}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md font-medium transition hover:bg-gray-50 disabled:opacity-50
              ${myReaction ? "text-blue-600" : "text-gray-600"}
            `}
                    >
                        <LikeIcon isActive={!!myReaction} />
                        Like
                    </button>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md font-medium transition hover:bg-gray-50
    ${showComments ? "text-emerald-600 bg-emerald-50" : "text-gray-600"}
  `}
                    >
                        <CommentIcon />
                        Comment
                    </button>
                </div>
            </div>

            {showComments && (
                <SocialCommentSection
                    postId={post.id}
                    accessToken={accessToken}
                    postAuthorId={post.authorId}
                />
            )}

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetId={post.id}
                targetType="POST"
                title={`Post by ${post.authorName}`}
            />
        </div>
    );
}

function LikeIcon({ isActive }: { isActive: boolean }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill={isActive ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
    );
}

function CommentIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-5 h-5"
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

function TrashIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
    );
}

function LinkIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    );
}

function FlagIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
    );
}
