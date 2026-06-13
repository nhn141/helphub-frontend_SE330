"use client";

import { useState, useEffect } from "react";
import { createPost, PostVisibility } from "@/lib/social-api";
import { useAuth } from "@/components/auth-provider";
import {
    getMySupportRequests,
    getSupportRequests,
    SupportRequestSummary,
} from "@/lib/api";

interface SocialPostFormProps {
    accessToken: string;
    onPostCreated: () => void;
}

export function SocialPostForm({
    accessToken,
    onPostCreated,
}: SocialPostFormProps) {
    const { profile } = useAuth();
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
    const [supportRequestId, setSupportRequestId] = useState<string>("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [availableRequests, setAvailableRequests] = useState<
        SupportRequestSummary[]
    >([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function fetchRequests() {
            if (!profile) return;
            setIsLoadingRequests(true);
            try {
                let requests: SupportRequestSummary[] = [];

                if (profile.role === "REQUESTER") {
                    requests = await getMySupportRequests(accessToken);
                } else {
                    requests = await getSupportRequests(accessToken);
                }

                const validStatuses = ["APPROVED", "IN_PROGRESS", "COMPLETED"];
                const validRequests = requests.filter((req) =>
                    validStatuses.includes(req.status),
                );

                if (isMounted) setAvailableRequests(validRequests);
            } catch (err) {
                console.error("Failed to fetch support requests:", err);
            } finally {
                if (isMounted) setIsLoadingRequests(false);
            }
        }

        fetchRequests();
        return () => {
            isMounted = false;
        };
    }, [profile, accessToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await createPost(accessToken, {
                content: content.trim(),
                visibility,
                supportRequestId: supportRequestId ? supportRequestId : null,
            });

            setContent("");
            setVisibility("PUBLIC");
            setSupportRequestId("");
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t pt-3 gap-3">
                <div className="flex-1 max-w-sm">
                    <select
                        value={supportRequestId}
                        onChange={(e) => setSupportRequestId(e.target.value)}
                        disabled={
                            isSubmitting ||
                            isLoadingRequests ||
                            availableRequests.length === 0
                        }
                        className="w-full text-xs sm:text-sm border-gray-300 rounded-md text-gray-700 bg-gray-50 focus:bg-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-1.5 pl-2 pr-8 truncate"
                    >
                        <option value="">
                            -- Attach a Support Request (Optional) --
                        </option>
                        {availableRequests.map((req) => (
                            <option key={req.id} value={req.id}>
                                {req.title} ({req.status})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={visibility}
                        onChange={(e) =>
                            setVisibility(e.target.value as PostVisibility)
                        }
                        disabled={isSubmitting}
                        className="text-xs sm:text-sm border-gray-300 rounded-md text-gray-700 bg-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-1.5 pl-2 pr-6"
                    >
                        <option value="PUBLIC">Public</option>
                        <option value="VOLUNTEERS_ONLY">Volunteers Only</option>
                    </select>

                    <button
                        type="submit"
                        disabled={!content.trim() || isSubmitting}
                        className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                    >
                        {isSubmitting ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>
        </form>
    );
}
