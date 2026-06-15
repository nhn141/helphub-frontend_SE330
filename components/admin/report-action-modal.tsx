"use client";

import { useState, useEffect } from "react";
import { Report } from "@/lib/admin-api";

interface ReportActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report | null;
    isSubmitting: boolean;
    onReview: (id: string, note: string) => Promise<void>;
    onResolve: (
        id: string,
        note: string,
        rejectionReason?: string,
    ) => Promise<void>;
}

export function ReportActionModal({
    isOpen,
    onClose,
    report,
    isSubmitting,
    onReview,
    onResolve,
}: ReportActionModalProps) {
    const [resolutionNote, setResolutionNote] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        if (isOpen && report) {
            setResolutionNote(report.resolutionNote || "");
            setRejectionReason("");
        }
    }, [isOpen, report]);

    if (!isOpen || !report) return null;

    const isResolved = report.status === "RESOLVED";
    const needsRejectionReason =
        report.targetType === "SUPPORT_REQUEST" && !isResolved;

    const handleReviewClick = async () => {
        await onReview(report.id, resolutionNote.trim());
    };

    const handleResolveClick = async () => {
        if (needsRejectionReason && !rejectionReason.trim()) {
            alert("Please provide a rejection reason for the Support Request.");
            return;
        }
        await onResolve(
            report.id,
            resolutionNote.trim(),
            needsRejectionReason ? rejectionReason.trim() : undefined,
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900">
                        {isResolved ? "Report Details" : "Process Report"}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-sm">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                                <span className="block text-[10px] uppercase font-bold text-rose-400">
                                    Target Type
                                </span>
                                <span className="font-semibold text-rose-900">
                                    {report.targetType}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase font-bold text-rose-400">
                                    Reported By
                                </span>
                                <span className="font-semibold text-rose-900">
                                    {report.reporterName}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-rose-400">
                                Violation Reason
                            </span>
                            <p className="font-medium text-rose-800">
                                {report.reason}
                            </p>
                            {report.description && (
                                <p className="mt-1 text-rose-700 text-xs italic">
                                    {report.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Admin Resolution Note {isResolved ? "" : "*"}
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            disabled={isSubmitting || isResolved}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:bg-slate-50"
                            placeholder="Internal note about how this was investigated..."
                        />
                    </div>

                    {needsRejectionReason && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-medium text-rose-700 mb-1">
                                Support Request Rejection Reason *
                            </label>
                            <textarea
                                required
                                rows={2}
                                value={rejectionReason}
                                onChange={(e) =>
                                    setRejectionReason(e.target.value)
                                }
                                disabled={isSubmitting}
                                className="w-full px-3 py-2 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none bg-rose-50/50"
                                placeholder="This will be sent to the requester when the request is automatically rejected..."
                            />
                            <p className="text-[10px] text-rose-500 mt-1">
                                Required because resolving this report will
                                automatically REJECT the target support request.
                            </p>
                        </div>
                    )}

                    {isResolved && report.resolvedByName && (
                        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border">
                            Resolved by{" "}
                            <span className="font-bold text-slate-700">
                                {report.resolvedByName}
                            </span>{" "}
                            on {new Date(report.resolvedAt!).toLocaleString()}
                        </div>
                    )}

                    {!isResolved && (
                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleReviewClick}
                                disabled={
                                    isSubmitting ||
                                    !resolutionNote.trim() ||
                                    report.status === "REVIEWED"
                                }
                                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition disabled:opacity-50"
                            >
                                Mark as Reviewed
                            </button>
                            <button
                                type="button"
                                onClick={handleResolveClick}
                                disabled={
                                    isSubmitting ||
                                    !resolutionNote.trim() ||
                                    (needsRejectionReason &&
                                        !rejectionReason.trim())
                                }
                                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
                            >
                                Resolve & Apply Action
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
