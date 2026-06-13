"use client";

import { useEffect, useState } from "react";
import { getPosts, PostSummaryResponse } from "@/lib/social-api";
import { getValidSession } from "@/lib/session";
import { SocialPostCard } from "@/components/social/social_post_card";

export function SocialClient() {
    const [posts, setPosts] = useState<PostSummaryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchFeed() {
            try {
                const session = await getValidSession();

                if (!session) {
                    if (isMounted) {
                        setError("Please log in to view the community feed.");
                        setIsLoading(false);
                    }
                    return;
                }

                if (isMounted) setAccessToken(session.accessToken);

                const data = await getPosts(session.accessToken);

                if (isMounted) setPosts(data);
            } catch (err: any) {
                if (isMounted) setError(err.message || "Failed to load posts.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchFeed();

        return () => {
            isMounted = false;
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
            {/* TODO: Add SocialPostForm here in the next step */}

            {posts.length === 0 ? (
                <p className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
                    No posts available right now. Be the first to share
                    something!
                </p>
            ) : (
                posts.map(
                    (post) =>
                        accessToken && (
                            <SocialPostCard
                                key={post.id}
                                post={post}
                                accessToken={accessToken}
                            />
                        ),
                )
            )}
        </div>
    );
}
