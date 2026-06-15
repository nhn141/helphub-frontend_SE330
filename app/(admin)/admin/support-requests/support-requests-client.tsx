"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import {
    LoadingBlock,
    Notice,
    PageHeading,
    EmptyState,
} from "@/components/support-ui";
import { SupportRequestFilters } from "@/components/admin/support-request-filters";
import { SupportRequestTable } from "@/components/admin/support-request-table";
import { SupportRequestSummary, SupportRequestStatus } from "@/lib/api";

import {
    getAdminSupportRequests,
    approveSupportRequest,
    rejectSupportRequest,
    assignSupportLocationToRequest,
    getAdminCategories,
    getAdminSupportLocations,
    Category,
    SupportLocation,
} from "@/lib/admin-api";

export function AdminSupportRequestsClient() {
    const { getAccessToken } = useAuth();

    const [requests, setRequests] = useState<SupportRequestSummary[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [locations, setLocations] = useState<SupportLocation[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState<
        SupportRequestStatus | "ALL"
    >("PENDING");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        async function loadMeta() {
            try {
                const token = await getAccessToken();
                const [cats, locs] = await Promise.all([
                    getAdminCategories(token, true),
                    getAdminSupportLocations(token, true),
                ]);
                setCategories(cats);
                setLocations(locs);
            } catch (err) {
                console.error("Failed to load metadata", err);
            }
        }
        loadMeta();
    }, [getAccessToken]);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getAccessToken();
            const data = await getAdminSupportRequests(token, {
                status: statusFilter !== "ALL" ? statusFilter : undefined,
                categoryId:
                    categoryFilter !== "ALL" ? categoryFilter : undefined,
            });
            setRequests(data);
        } catch (err: any) {
            setError(err.message || "Failed to load support requests.");
        } finally {
            setLoading(false);
        }
    }, [getAccessToken, statusFilter, categoryFilter]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (id: string) => {
        if (
            !window.confirm(
                "Approve this support request? It will become visible to the community.",
            )
        )
            return;

        setProcessingId(id);
        try {
            const token = await getAccessToken();
            await approveSupportRequest(token, id);
            fetchRequests();
        } catch (err: any) {
            alert(`Failed to approve: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt(
            "Please enter the reason for rejection (required):",
        );
        if (reason === null) return;
        if (!reason.trim()) {
            alert("Rejection reason cannot be empty.");
            return;
        }

        setProcessingId(id);
        try {
            const token = await getAccessToken();
            await rejectSupportRequest(token, id, {
                rejectionReason: reason.trim(),
            });
            fetchRequests();
        } catch (err: any) {
            alert(`Failed to reject: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleAssignLocation = async (id: string, locationId: string) => {
        if (!locationId) return;
        setProcessingId(id);
        try {
            const token = await getAccessToken();
            await assignSupportLocationToRequest(token, id, {
                supportLocationId: locationId,
            });
            alert("Support location assigned successfully!");
            fetchRequests();
        } catch (err: any) {
            alert(`Failed to assign location: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <>
            <PageHeading
                eyebrow="Moderation"
                title="Support Requests"
                description="Review incoming requests, approve valid needs, and assign drop-off locations."
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <SupportRequestFilters
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    categories={categories}
                    onRefresh={fetchRequests}
                />

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
                            title="No requests found"
                            description="Try changing your filters."
                        />
                    </div>
                ) : (
                    <SupportRequestTable
                        requests={requests}
                        locations={locations}
                        processingId={processingId}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onAssignLocation={handleAssignLocation}
                    />
                )}
            </div>
        </>
    );
}
