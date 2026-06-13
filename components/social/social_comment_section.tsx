"use client";

import { useEffect, useState } from "react";
import {
    PostComment,
    getPostComments,
    createPostComment,
    deletePostComment,
    updatePostComment,
} from "@/lib/social-api";
import { useAuth } from "../auth-provider";

interface SocialCommentSectionProps {
    postId: string;
    accessToken: string;
    postAuthorId: string;
}

export function SocialCommentSection({
    postId,
    accessToken,
    postAuthorId,
}: SocialCommentSectionProps) {
    const { profile } = useAuth();
    const [comments, setComments] = useState<PostComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function fetchComments() {
            try {
                const data = await getPostComments(accessToken, postId);
                const patchedData = data.map((comment) => {
                    const assumedAuthorId = comment.authorId || profile?.id;

                    return {
                        ...comment,
                        authorId: assumedAuthorId,
                        authorName:
                            comment.authorName ||
                            (assumedAuthorId === profile?.id
                                ? profile?.fullName
                                : "HelpHub User"),
                        authorAvatarUrl:
                            comment.authorAvatarUrl ||
                            (assumedAuthorId === profile?.id
                                ? profile?.avatarUrl
                                : null),
                    };
                });
                if (isMounted) setComments(patchedData);
            } catch (error) {
                console.error("Failed to load comments:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchComments();
        return () => {
            isMounted = false;
        };
    }, [postId, accessToken, profile]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const addedComment = await createPostComment(accessToken, postId, {
                content: newComment.trim(),
                parentCommentId: null,
            });

            const patchedComment = {
                ...addedComment,
                authorId: profile?.id || addedComment.authorId,
                authorName:
                    addedComment.authorName ||
                    profile?.fullName ||
                    "HelpHub User",
                authorAvatarUrl:
                    addedComment.authorAvatarUrl || profile?.avatarUrl || null,
                createdAt: addedComment.createdAt || new Date().toISOString(),
            };

            setComments((prev) => [patchedComment, ...prev]);
            setNewComment("");
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        const confirmDelete = window.confirm("Delete this comment?");
        if (!confirmDelete) return;

        setProcessingId(commentId);
        try {
            await deletePostComment(accessToken, commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (error) {
            console.error("Failed to delete comment:", error);
            alert("Failed to delete comment.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleUpdate = async (commentId: string) => {
        if (!editContent.trim()) return;
        setProcessingId(commentId);
        try {
            await updatePostComment(accessToken, commentId, {
                content: editContent.trim(),
            });
            setComments((prev) =>
                prev.map((c) =>
                    c.id === commentId
                        ? { ...c, content: editContent.trim() }
                        : c,
                ),
            );
            setEditingId(null);
        } catch (error) {
            console.error("Failed to update comment:", error);
            alert("Failed to update comment.");
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="py-4 text-center text-sm text-gray-500">
                Loading comments...
            </div>
        );
    }

    return (
        <div className="pt-4 mt-2 border-t border-gray-100">
            <form onSubmit={handleCreate} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                    Post
                </button>
            </form>

            {comments.length === 0 ? (
                <p className="text-sm text-center text-gray-500 py-2">
                    No comments yet.
                </p>
            ) : (
                <div className="space-y-3">
                    {comments.map((comment) => {
                        const isCommentOwner = profile?.id === comment.authorId;
                        const canDelete =
                            isCommentOwner ||
                            profile?.id === postAuthorId ||
                            profile?.role === "ADMIN";
                        const isEditing = editingId === comment.id;

                        return (
                            <div key={comment.id} className="flex gap-2 group">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-500">
                                    {comment.authorAvatarUrl ? (
                                        <img
                                            src={comment.authorAvatarUrl}
                                            alt={comment.authorName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        (comment.authorName || "U")
                                            .charAt(0)
                                            .toUpperCase()
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="bg-gray-50 p-2.5 rounded-2xl rounded-tl-none inline-block min-w-[200px] max-w-full">
                                        <h5 className="text-xs font-semibold text-gray-900">
                                            {comment.authorName ||
                                                "HelpHub User"}
                                        </h5>

                                        {isEditing ? (
                                            <div className="mt-1">
                                                <input
                                                    type="text"
                                                    value={editContent}
                                                    onChange={(e) =>
                                                        setEditContent(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full px-2 py-1 text-sm border rounded mb-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleUpdate(
                                                                comment.id,
                                                            )
                                                        }
                                                        disabled={
                                                            processingId ===
                                                            comment.id
                                                        }
                                                        className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setEditingId(null)
                                                        }
                                                        disabled={
                                                            processingId ===
                                                            comment.id
                                                        }
                                                        className="text-[10px] font-medium text-gray-500 hover:text-gray-700"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-800 mt-0.5">
                                                {comment.content}
                                            </p>
                                        )}
                                    </div>

                                    {!isEditing && (
                                        <div className="flex items-center gap-3 mt-1 ml-2 text-[10px] text-gray-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span>
                                                {new Date(
                                                    comment.createdAt,
                                                ).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                            {isCommentOwner && (
                                                <button
                                                    onClick={() => {
                                                        setEditingId(
                                                            comment.id,
                                                        );
                                                        setEditContent(
                                                            comment.content,
                                                        );
                                                    }}
                                                    className="hover:text-blue-600"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() =>
                                                        handleDelete(comment.id)
                                                    }
                                                    disabled={
                                                        processingId ===
                                                        comment.id
                                                    }
                                                    className="hover:text-red-600"
                                                >
                                                    {processingId === comment.id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
