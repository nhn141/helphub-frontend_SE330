"use client";

import { useEffect, useState } from "react";
import {
    PostComment,
    getPostComments,
    createPostComment,
} from "@/lib/social-api";

interface SocialCommentSectionProps {
    postId: string;
    accessToken: string;
}

export function SocialCommentSection({
    postId,
    accessToken,
}: SocialCommentSectionProps) {
    const [comments, setComments] = useState<PostComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchComments() {
            try {
                const data = await getPostComments(accessToken, postId);
                if (isMounted) setComments(data);
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
    }, [postId, accessToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const addedComment = await createPostComment(accessToken, postId, {
                content: newComment.trim(),
                parentCommentId: null,
            });

            setComments((prev) => [addedComment, ...prev]);
            setNewComment("");
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setIsSubmitting(false);
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
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
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
                    No comments yet. Be the first to comment!
                </p>
            ) : (
                <div className="space-y-3">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2">
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
                            <div className="flex-1 bg-gray-50 p-2.5 rounded-2xl rounded-tl-none">
                                <h5 className="text-xs font-semibold text-gray-900">
                                    {comment.authorName || "HelpHub User"}
                                </h5>
                                <p className="text-sm text-gray-800 mt-0.5">
                                    {comment.content}
                                </p>
                                <div className="text-[10px] text-gray-400 mt-1">
                                    {new Date(
                                        comment.createdAt,
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
