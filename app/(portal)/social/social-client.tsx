"use client";

import { useEffect, useState, useCallback } from "react";
import { getPosts, PostSummaryResponse } from "@/lib/social-api";
import { getValidSession } from "@/lib/session";
import { SocialPostForm } from "@/components/social/social_post_form";
import { SocialPostCard } from "@/components/social/social_post_card";

export function SocialClient() {
    const [posts, setPosts] = useState<PostSummaryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [refreshKey, setRefreshKey] = useState(0);

    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        try {
            const session = await getValidSession();

            if (!session) {
                setError("Please log in to view the community feed.");
                setIsLoading(false);
                return;
            }

            setAccessToken(session.accessToken);
            const data = await getPosts(session.accessToken);

            setPosts(data);
        } catch (err: any) {
            setError(err.message || "Failed to load posts.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed, refreshKey]);

    const handlePostCreated = () => {
        setRefreshKey((prev) => prev + 1);
    };

    if (isLoading && posts.length === 0) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-md text-center">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {accessToken && (
                <SocialPostForm
                    accessToken={accessToken}
                    onPostCreated={handlePostCreated}
                />
            )}

            {posts.length === 0 ? (
                <p className="text-center text-gray-500 py-10 bg-white border border-gray-200 rounded-lg shadow-sm">
                    No posts available right now. Be the first to share
                    something!
                </p>
            ) : (
                <div className="space-y-4">
                    {posts.map(
                        (post) =>
                            accessToken && (
                                <SocialPostCard
                                    key={post.id}
                                    post={post}
                                    accessToken={accessToken}
                                />
                            ),
                    )}
                </div>
            )}
        </div>
    );
}
