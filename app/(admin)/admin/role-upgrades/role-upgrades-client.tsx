"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import {
    LoadingBlock,
    Notice,
    PageHeading,
    EmptyState,
} from "@/components/support-ui";
import {
    getRoleUpgradeRequestsList,
    approveRoleUpgradeRequest,
    rejectRoleUpgradeRequest,
    RoleUpgradeRequest,
    RoleUpgradeRequestStatus,
} from "@/lib/admin-api";

export function AdminRoleUpgradesClient() {
    const { getAccessToken } = useAuth();

    const [requests, setRequests] = useState<RoleUpgradeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [statusFilter, setStatusFilter] = useState<
        RoleUpgradeRequestStatus | "ALL"
    >("PENDING");

    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getAccessToken();
            const response = await getRoleUpgradeRequestsList(token, {
                status: statusFilter !== "ALL" ? statusFilter : undefined,
                page,
                size: 10,
            });

            setRequests(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (err: any) {
            setError(err.message || "Failed to load upgrade requests.");
        } finally {
            setLoading(false);
        }
    }, [getAccessToken, statusFilter, page]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleStatusChange = (
        newStatus: RoleUpgradeRequestStatus | "ALL",
    ) => {
        setStatusFilter(newStatus);
        setPage(0);
    };

    const handleApprove = async (id: string) => {
        if (
            !window.confirm(
                "Approve this request? The user will immediately be promoted to COLLABORATOR.",
            )
        )
            return;

        setProcessingId(id);
        try {
            const token = await getAccessToken();
            await approveRoleUpgradeRequest(token, id);
            fetchRequests();
        } catch (err: any) {
            alert(`Failed to approve: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt("Please enter the reason for rejection:");
        if (reason === null) return;
        if (!reason.trim()) {
            alert("Rejection reason cannot be empty.");
            return;
        }

        setProcessingId(id);
        try {
            const token = await getAccessToken();
            await rejectRoleUpgradeRequest(token, id, {
                rejectionReason: reason.trim(),
            });
            fetchRequests();
        } catch (err: any) {
            alert(`Failed to reject: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <>
            <PageHeading
                eyebrow="Access Control"
                title="Role Upgrade Requests"
                description="Review and process applications from Volunteers wanting to become Collaborators."
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-3 flex-wrap">
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            handleStatusChange(
                                e.target.value as
                                    | RoleUpgradeRequestStatus
                                    | "ALL",
                            )
                        }
                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[150px]"
                    >
                        <option value="ALL">All Requests</option>
                        <option value="PENDING">Pending (Action Req)</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                    <button
                        onClick={fetchRequests}
                        className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                    >
                        Refresh
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
                ) : requests.length === 0 ? (
                    <div className="py-8 border-t border-slate-100">
                        <EmptyState
                            title="No upgrade requests found"
                            description="You're all caught up."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3 min-w-[150px]">
                                        Applicant
                                    </th>
                                    <th className="px-5 py-3 min-w-[250px]">
                                        Reason & Evidence
                                    </th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map((req) => {
                                    const isProcessing =
                                        processingId === req.id;
                                    const isPending = req.status === "PENDING";

                                    return (
                                        <tr
                                            key={req.id}
                                            className="hover:bg-slate-50 transition"
                                        >
                                            <td className="px-5 py-3 align-top">
                                                <p className="font-semibold text-slate-900">
                                                    {req.userFullName}
                                                </p>
                                                <p
                                                    className="text-[10px] text-slate-500 font-mono mt-1"
                                                    title={req.userId}
                                                >
                                                    UID:{" "}
                                                    {req.userId
                                                        ? req.userId.substring(
                                                              0,
                                                              8,
                                                          )
                                                        : "N/A"}
                                                    ...
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {new Date(
                                                        req.createdAt,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </td>

                                            <td className="px-5 py-3 align-top">
                                                <p className="text-sm text-slate-700 italic">
                                                    "{req.reason}"
                                                </p>
                                                {req.supportingDocumentsUrl && (
                                                    <a
                                                        href={
                                                            req.supportingDocumentsUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block mt-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                                                    >
                                                        📎 View Supporting
                                                        Document
                                                    </a>
                                                )}
                                                {req.rejectionReason && (
                                                    <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded text-xs text-rose-700">
                                                        <span className="font-bold">
                                                            Rejected
                                                            because:{" "}
                                                        </span>
                                                        {req.rejectionReason}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-3 align-top">
                                                <span
                                                    className={`text-[10px] uppercase font-bold px-2 py-1 rounded
                          ${
                              req.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : req.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                          }`}
                                                >
                                                    {req.status}
                                                </span>
                                                {req.processedByName &&
                                                    !isPending && (
                                                        <p className="text-[10px] text-slate-400 mt-1">
                                                            by{" "}
                                                            {
                                                                req.processedByName
                                                            }
                                                        </p>
                                                    )}
                                            </td>

                                            <td className="px-5 py-3 text-right align-top">
                                                {isPending ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleApprove(
                                                                    req.id,
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 disabled:opacity-50"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleReject(
                                                                    req.id,
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded hover:bg-rose-100 disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">
                                                        Processed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                        <p className="text-xs text-slate-500">
                            Page{" "}
                            <span className="font-semibold text-slate-700">
                                {page + 1}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-700">
                                {totalPages}
                            </span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    setPage((p) => Math.max(0, p - 1))
                                }
                                disabled={page === 0}
                                className="px-3 py-1 text-xs font-medium border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(totalPages - 1, p + 1),
                                    )
                                }
                                disabled={page >= totalPages - 1}
                                className="px-3 py-1 text-xs font-medium border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
