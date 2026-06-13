"use client";

import { useState } from "react";
import { createPost, PostVisibility } from "@/lib/social-api";

interface SocialPostFormProps {
    accessToken: string;
    onPostCreated: () => void;
}

export function SocialPostForm({
    accessToken,
    onPostCreated,
}: SocialPostFormProps) {
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await createPost(accessToken, {
                content: content.trim(),
                visibility,
                supportRequestId: null,
            });

            setContent("");
            setVisibility("PUBLIC");

            onPostCreated();
        } catch (err: any) {
            setError(err.message || "Failed to create post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="p-4 mb-6 bg-white border rounded-lg shadow-sm"
        >
            <div className="mb-3">
                <textarea
                    className="w-full p-3 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                    rows={3}
                    placeholder="What's on your mind or need to share?..."
                    value={content}
                    maxLength={2000}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSubmitting}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                    {content.length}/2000
                </div>
            </div>

            {error && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition"
                        disabled={isSubmitting}
                        onClick={() =>
                            alert("Media upload feature coming soon!")
                        }
                    >
                        <PhotoIcon />
                        Photo/Video
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={visibility}
                        onChange={(e) =>
                            setVisibility(e.target.value as PostVisibility)
                        }
                        disabled={isSubmitting}
                        className="text-sm border-gray-300 rounded-md text-gray-700 bg-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-1.5 pl-3 pr-8"
                    >
                        <option value="PUBLIC">Public</option>
                        <option value="VOLUNTEERS_ONLY">Volunteers Only</option>
                    </select>

                    <button
                        type="submit"
                        disabled={!content.trim() || isSubmitting}
                        className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {isSubmitting ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>
        </form>
    );
}

function PhotoIcon() {
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
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    );
}
