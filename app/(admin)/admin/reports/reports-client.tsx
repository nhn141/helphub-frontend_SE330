"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import {
    LoadingBlock,
    Notice,
    PageHeading,
    EmptyState,
} from "@/components/support-ui";
import { ReportTable } from "@/components/admin/report-table";
import { ReportActionModal } from "@/components/admin/report-action-modal";
import {
    getAllReports,
    reviewReport,
    resolveReport,
    Report,
    ReportStatus,
} from "@/lib/admin-api";

export function AdminReportsClient() {
    const { getAccessToken } = useAuth();

    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">(
        "ALL",
    );

    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getAccessToken();
            const data = await getAllReports(token);
            setReports(data);
        } catch (err: any) {
            setError(err.message || "Failed to load reports.");
        } finally {
            setLoading(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const filteredReports =
        statusFilter === "ALL"
            ? reports
            : reports.filter((r) => r.status === statusFilter);

    const handleReview = async (id: string, note: string) => {
        setIsSubmitting(true);
        try {
            const token = await getAccessToken();
            await reviewReport(token, id, { resolutionNote: note });
            await fetchReports();
            setIsModalOpen(false);
        } catch (err: any) {
            alert(`Failed to review report: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolve = async (
        id: string,
        note: string,
        rejectionReason?: string,
    ) => {
        if (
            !window.confirm(
                "Are you sure you want to RESOLVE this report? This action will apply strict penalties to the target.",
            )
        )
            return;

        setIsSubmitting(true);
        try {
            const token = await getAccessToken();
            await resolveReport(token, id, {
                resolutionNote: note,
                supportRequestRejectionReason: rejectionReason,
            });
            await fetchReports();
            setIsModalOpen(false);
        } catch (err: any) {
            alert(`Failed to resolve report: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openActionModal = (report: Report) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

    return (
        <>
            <PageHeading
                eyebrow="Moderation"
                title="Reports"
                description="Investigate community flags and enforce platform guidelines."
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-3 flex-wrap">
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as ReportStatus | "ALL",
                            )
                        }
                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[150px]"
                    >
                        <option value="ALL">All Reports</option>
                        <option value="PENDING">Pending (Action Req)</option>
                        <option value="REVIEWED">Reviewed (Watching)</option>
                        <option value="RESOLVED">Resolved (Closed)</option>
                    </select>

                    <button
                        onClick={fetchReports}
                        className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                    >
                        Refresh List
                    </button>
                </div>

                {error && (
                    <div className="p-4">
                        <Notice type="error">{error}</Notice>
                    </div>
                )}

                {loading ? (
                    <div className="py-10">
                        <LoadingBlock />
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="py-8 border-t border-slate-100">
                        <EmptyState
                            title="No reports found"
                            description="The community is looking good!"
                        />
                    </div>
                ) : (
                    <ReportTable
                        reports={filteredReports}
                        onActionClick={openActionModal}
                    />
                )}
            </div>

            <ReportActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                report={selectedReport}
                isSubmitting={isSubmitting}
                onReview={handleReview}
                onResolve={handleResolve}
            />
        </>
    );
}
