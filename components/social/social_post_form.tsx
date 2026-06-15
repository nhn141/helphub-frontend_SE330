"use client";

import { useState, useEffect, useRef } from "react";
import {
    attachMediaToPost,
    createMediaRecord,
    createPost,
    PostVisibility,
} from "@/lib/social-api";
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

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            if (selectedFiles.length + filesArray.length > 4) {
                alert("You can only upload up to 4 images.");
                return;
            }
            setSelectedFiles((prev) => [...prev, ...filesArray]);

            const newPreviews = filesArray.map((file) =>
                URL.createObjectURL(file),
            );
            setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const removePreview = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadImagesToCloudinary = async (): Promise<string[]> => {
        if (selectedFiles.length === 0) return [];

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error("Cloudinary configuration is missing.");
        }

        const uploadedUrls: string[] = [];

        for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                },
            );

            if (!res.ok)
                throw new Error("Failed to upload image to Cloudinary");

            const data = await res.json();
            uploadedUrls.push(data.secure_url);
        }

        return uploadedUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && selectedFiles.length === 0) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const newPost = await createPost(accessToken, {
                content: content.trim(),
                visibility,
                supportRequestId: supportRequestId ? supportRequestId : null,
            });

            if (selectedFiles.length > 0) {
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                const uploadPreset =
                    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

                if (!cloudName || !uploadPreset) {
                    throw new Error(
                        "Cloudinary configuration is missing in .env.local.",
                    );
                }

                let displayOrder = 0;

                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("upload_preset", uploadPreset);

                    const res = await fetch(
                        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                        { method: "POST", body: formData },
                    );

                    if (!res.ok)
                        throw new Error("Failed to upload image to Cloudinary");
                    const cloudData = await res.json();

                    const mediaRecord = await createMediaRecord(accessToken, {
                        fileName: file.name,
                        fileUrl: cloudData.secure_url,
                        fileType: "IMAGE",
                        mimeType: file.type || "image/jpeg",
                        fileSize: file.size || cloudData.bytes,
                        altText: null,
                        isPublic: true,
                    });

                    await attachMediaToPost(accessToken, newPost.id, {
                        mediaId: mediaRecord.id,
                        displayOrder: displayOrder++,
                    });
                }
            }

            setContent("");
            setVisibility("PUBLIC");
            setSupportRequestId("");
            setSelectedFiles([]);
            setImagePreviews([]);
            onPostCreated();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
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

            {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {imagePreviews.map((url, index) => (
                        <div key={index} className="relative w-20 h-20 group">
                            <img
                                src={url}
                                alt={`Preview ${index}`}
                                className="w-full h-full object-cover rounded-md border"
                            />
                            <button
                                type="button"
                                onClick={() => removePreview(index)}
                                disabled={isSubmitting}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-sm"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                    {error}
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t pt-3 gap-3">
                <div className="flex flex-1 max-w-md items-center gap-2">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        disabled={isSubmitting}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting || selectedFiles.length >= 4}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition disabled:opacity-50"
                        title="Attach images"
                    >
                        <ImageIcon />
                    </button>

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
                        disabled={
                            (content.trim() === "" &&
                                selectedFiles.length === 0) ||
                            isSubmitting
                        }
                        className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                    >
                        {isSubmitting ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>
        </form>
    );
}

function ImageIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    );
}
