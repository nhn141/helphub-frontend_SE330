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
} from "@/lib/social-api";

interface SocialPostCardProps {
    post: PostSummaryResponse;
    accessToken: string;
}

export function SocialPostCard({ post, accessToken }: SocialPostCardProps) {
    const [media, setMedia] = useState<PostMedia[]>([]);
    const [reactionCount, setReactionCount] = useState<ReactionCount | null>(
        null,
    );
    const [myReaction, setMyReaction] = useState<PostReactionType | null>(null);

    const [isLoadingExtras, setIsLoadingExtras] = useState(true);
    const [isReacting, setIsReacting] = useState(false);

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

    return (
        <div className="p-4 bg-white border rounded-lg shadow-sm">
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
            </div>

            <p className="text-gray-800 whitespace-pre-wrap mb-3">
                {post.content}
            </p>

            {isLoadingExtras ? (
                <div className="animate-pulse h-8 bg-gray-50 rounded-md mb-3 w-1/3"></div>
            ) : (
                media.length > 0 && (
                    <div
                        className={`grid gap-2 mb-3 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                    >
                        {media.map((item) => (
                            <img
                                key={item.id}
                                src={item.fileUrl}
                                alt={item.fileName}
                                className="w-full h-auto max-h-64 object-cover rounded-md border"
                            />
                        ))}
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
                    <button className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md font-medium text-gray-600 hover:bg-gray-50 transition">
                        <CommentIcon />
                        Comment
                    </button>
                </div>
            </div>
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
