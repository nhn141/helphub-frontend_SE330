"use client";

import { useEffect, useState, useCallback } from "react";
import { getPosts, getMyPosts, PostSummaryResponse } from "@/lib/social-api";
import { getValidSession } from "@/lib/session";
import { SocialPostCard } from "@/components/social/social_post_card";
import {
    EmptyState,
    LoadingBlock,
    Notice,
    PageHeading,
} from "@/components/support-ui";
import { SocialPostForm } from "@/components/social/social_post_form";

type TabType = "ALL" | "MY_POSTS";

export function SocialClient() {
    const [posts, setPosts] = useState<PostSummaryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState<TabType>("ALL");

    const loadData = useCallback(async () => {
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
        const timer = window.setTimeout(() => {
            void loadData();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadData, refreshKey]);

    const handlePostCreated = () => {
        setRefreshKey((prev) => prev + 1);
        setActiveTab("ALL");
    };

    const handlePostRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="space-y-6">
            {/* 1. Header nhất quán với các trang khác */}
            <PageHeading
                eyebrow="Community"
                title="Social Feed"
                description="Share updates, coordinate efforts, and stay connected with the community."
            />
            <div className="mx-auto max-w-3xl space-y-6">
                {/* 2. Hiển thị Lỗi chuẩn UI */}
                {error ? (
                    <Notice type="error">
                        {error}{" "}
                        <button
                            type="button"
                            className="font-semibold underline"
                            onClick={() => void loadData()}
                        >
                            Try again
                        </button>
                    </Notice>
                ) : null}

                {/* 3. Thanh điều hướng Tabs (Sử dụng pill design chuẩn) */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab("ALL")}
                            className={tabClassName(activeTab === "ALL")}
                        >
                            Community Feed
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("MY_POSTS")}
                            className={tabClassName(activeTab === "MY_POSTS")}
                        >
                            My Posts
                        </button>
                    </div>
                </section>

                {accessToken && (
                    <SocialPostForm
                        accessToken={accessToken}
                        onPostCreated={handlePostCreated}
                    />
                )}

                {isLoading ? (
                    <LoadingBlock />
                ) : posts.length === 0 ? (
                    <EmptyState
                        title={
                            activeTab === "ALL"
                                ? "No posts available"
                                : "You haven't posted anything yet"
                        }
                        description={
                            activeTab === "ALL"
                                ? "Be the first to share something with the community!"
                                : "Share your updates and needs with the community."
                        }
                    />
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
        </div>
    );
}

function tabClassName(active: boolean): string {
    return `h-9 rounded-lg px-4 text-sm font-semibold transition ${
        active
            ? "bg-white text-emerald-800 shadow-sm"
            : "text-slate-500 hover:text-slate-800"
    }`;
}
