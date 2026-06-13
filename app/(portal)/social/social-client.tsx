"use client";

import { useEffect, useState, useCallback } from "react";
import { getPosts, getMyPosts, PostSummaryResponse } from "@/lib/social-api";
import { getValidSession } from "@/lib/session";
import { SocialPostCard } from "@/components/social/social_post_card";
import { SocialPostForm } from "@/components/social/social_post_form";

type TabType = "ALL" | "MY_POSTS";

export function SocialClient() {
    const [posts, setPosts] = useState<PostSummaryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState<TabType>("ALL");

    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const session = await getValidSession();

            if (!session) {
                setError("Please log in to view the community feed.");
                setIsLoading(false);
                return;
            }

            setAccessToken(session.accessToken);

            const data =
                activeTab === "ALL"
                    ? await getPosts(session.accessToken)
                    : await getMyPosts(session.accessToken);

            setPosts(data);
        } catch (err: any) {
            setError(err.message || "Failed to load posts.");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed, refreshKey]);

    const handlePostCreated = () => {
        setRefreshKey((prev) => prev + 1);
        setActiveTab("ALL");
    };

    const handlePostRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    if (isLoading && posts.length === 0) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
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

            <div className="flex items-center gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("ALL")}
                    className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "ALL"
                            ? "border-emerald-600 text-emerald-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Community Feed
                </button>
                <button
                    onClick={() => setActiveTab("MY_POSTS")}
                    className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "MY_POSTS"
                            ? "border-emerald-600 text-emerald-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    My Posts
                </button>
            </div>

            {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-md text-center">
                    {error}
                </div>
            ) : posts.length === 0 ? (
                <p className="text-center text-gray-500 py-10 bg-white border border-gray-200 rounded-lg shadow-sm">
                    {activeTab === "ALL"
                        ? "No posts available right now. Be the first to share something!"
                        : "You haven't posted anything yet."}
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
                                    onDelete={handlePostRefresh}
                                />
                            ),
                    )}
                </div>
            )}
        </div>
    );
}
