"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { createReport } from "@/lib/api";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetId: string;
    targetType: "POST" | "SUPPORT_REQUEST" | "USER";
    title?: string;
}

export function ReportModal({
    isOpen,
    onClose,
    targetId,
    targetType,
    title,
}: ReportModalProps) {
    const { getAccessToken } = useAuth();
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const token = await getAccessToken();
            await createReport(token, {
                targetType,
                targetId,
                reason: reason.trim(),
            });

            alert(
                "Report submitted successfully. Thank you for keeping our community safe.",
            );
            setReason("");
            onClose();
        } catch (err: any) {
            setError(
                err.message ||
                    "Failed to submit report. You might have already reported this item.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const typeLabels = {
        POST: "Post",
        SUPPORT_REQUEST: "Support Request",
        USER: "User",
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-rose-50/30">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-rose-600">🚩</span> Report{" "}
                        {typeLabels[targetType]}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <p className="text-sm text-slate-600 mb-3">
                            You are reporting{" "}
                            {title ? (
                                <span className="font-semibold text-slate-900">
                                    "{title}"
                                </span>
                            ) : (
                                `this ${typeLabels[targetType].toLowerCase()}`
                            )}
                            . Our moderation team will review it shortly.
                        </p>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Reason for reporting *
                        </label>
                        <textarea
                            required
                            maxLength={1000}
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                            placeholder="Please provide specific details about why this violates our community guidelines..."
                        />
                        <p className="text-xs text-slate-400 mt-1 text-right">
                            {reason.length}/1000
                        </p>
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !reason.trim()}
                            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 transition"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Report"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
