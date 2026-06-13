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

    return (
        <div className="p-4 mb-4 bg-white border rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
                    {post.authorAvatarUrl ? (
                        <img
                            src={post.authorAvatarUrl}
                            alt={post.authorName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            ?
                        </div>
                    )}
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900">
                        {post.authorName}
                    </h4>
                    <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")} •{" "}
                        {post.visibility}
                    </p>
                </div>
            </div>

            <p className="text-gray-800 whitespace-pre-wrap mb-3">
                {post.content}
            </p>

            {isLoadingExtras ? (
                <div className="animate-pulse h-32 bg-gray-100 rounded-md mb-3"></div>
            ) : (
                media.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {media.map((item) => (
                            <img
                                key={item.id}
                                src={item.fileUrl}
                                alt={item.fileName}
                                className="w-full h-48 object-cover rounded-md border"
                            />
                        ))}
                    </div>
                )
            )}

            <div className="pt-3 border-t flex items-center justify-between text-sm text-gray-600">
                <div>
                    {reactionCount
                        ? `👍 ${reactionCount.totalCount} lượt thích`
                        : "0 likes"}
                </div>
                <div className="flex gap-4">
                    <button
                        className={`font-medium ${myReaction ? "text-blue-600" : "text-gray-600"}`}
                    >
                        {myReaction ? myReaction : "Thích"}
                    </button>
                    <button className="font-medium text-gray-600">
                        Comment
                    </button>
                </div>
            </div>
        </div>
    );
}
