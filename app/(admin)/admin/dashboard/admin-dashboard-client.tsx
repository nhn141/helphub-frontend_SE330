"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { LoadingBlock, Notice, PageHeading } from "@/components/support-ui";
import {
    getAdminDashboardUsers,
    getAdminDashboardSupportRequests,
    getAdminDashboardCategories,
    getAdminDashboardPosts,
    getAdminDashboardReports,
    UserDashboardStats,
    SupportRequestDashboardStats,
    CategoryDashboardStats,
    PostDashboardStats,
    ReportDashboardStats,
} from "@/lib/admin-api";

export function AdminDashboardClient() {
    const { getAccessToken } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userStats, setUserStats] = useState<UserDashboardStats | null>(null);
    const [requestStats, setRequestStats] =
        useState<SupportRequestDashboardStats | null>(null);
    const [categoryStats, setCategoryStats] =
        useState<CategoryDashboardStats | null>(null);
    const [postStats, setPostStats] = useState<PostDashboardStats | null>(null);
    const [reportStats, setReportStats] = useState<ReportDashboardStats | null>(
        null,
    );

    useEffect(() => {
        let isMounted = true;

        async function loadDashboardData() {
            setLoading(true);
            setError(null);
            try {
                const token = await getAccessToken();
                if (!token) throw new Error("No access token available");

                const [users, requests, categories, posts, reports] =
                    await Promise.all([
                        getAdminDashboardUsers(token),
                        getAdminDashboardSupportRequests(token),
                        getAdminDashboardCategories(token),
                        getAdminDashboardPosts(token),
                        getAdminDashboardReports(token),
                    ]);

                if (isMounted) {
                    setUserStats(users);
                    setRequestStats(requests);
                    setCategoryStats(categories);
                    setPostStats(posts);
                    setReportStats(reports);
                }
            } catch (err: any) {
                if (isMounted)
                    setError(
                        err.message || "Failed to load dashboard statistics.",
                    );
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadDashboardData();

        return () => {
            isMounted = false;
        };
    }, [getAccessToken]);

    if (loading) return <LoadingBlock />;

    if (error) {
        return (
            <Notice type="error">
                {error}{" "}
                <button
                    onClick={() => window.location.reload()}
                    className="underline"
                >
                    Retry
                </button>
            </Notice>
        );
    }

    return (
        <>
            <PageHeading
                eyebrow="Overview"
                title="Admin Dashboard"
                description="High-level metrics and system-wide statistics for HelpHub."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userStats && (
                    <StatCard title="Users Overview">
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-4xl font-black text-slate-800">
                                {userStats.total || 0}
                            </span>
                            <span className="text-sm font-medium text-slate-500 mb-1">
                                total accounts
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Active</span>
                                <span className="font-semibold text-emerald-600">
                                    {userStats.active || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm border-b pb-2">
                                <span className="text-slate-600">Inactive</span>
                                <span className="font-semibold text-rose-600">
                                    {userStats.inactive || 0}
                                </span>
                            </div>
                            <div className="pt-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    By Role
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        REQ:{" "}
                                        <span className="font-bold">
                                            {userStats.byRole?.REQUESTER || 0}
                                        </span>
                                    </div>
                                    <div>
                                        VOL:{" "}
                                        <span className="font-bold">
                                            {userStats.byRole?.VOLUNTEER || 0}
                                        </span>
                                    </div>
                                    <div>
                                        COL:{" "}
                                        <span className="font-bold">
                                            {userStats.byRole?.COLLABORATOR ||
                                                0}
                                        </span>
                                    </div>
                                    <div>
                                        ADM:{" "}
                                        <span className="font-bold">
                                            {userStats.byRole?.ADMIN || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </StatCard>
                )}

                {requestStats && (
                    <StatCard title="Support Requests">
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-4xl font-black text-slate-800">
                                {requestStats.total || 0}
                            </span>
                            <span className="text-sm font-medium text-slate-500 mb-1">
                                total requests
                            </span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center bg-amber-50 px-2 py-1.5 rounded text-amber-800">
                                <span>Pending Approval</span>
                                <span className="font-bold">
                                    {requestStats.byStatus?.PENDING || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-emerald-50 px-2 py-1.5 rounded text-emerald-800">
                                <span>Approved</span>
                                <span className="font-bold">
                                    {requestStats.byStatus?.APPROVED || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-blue-50 px-2 py-1.5 rounded text-blue-800">
                                <span>In Progress</span>
                                <span className="font-bold">
                                    {requestStats.byStatus?.IN_PROGRESS || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded text-slate-600">
                                <span>Completed</span>
                                <span className="font-bold">
                                    {requestStats.byStatus?.COMPLETED || 0}
                                </span>
                            </div>
                        </div>
                    </StatCard>
                )}

                {reportStats && (
                    <StatCard title="Reports & Flags">
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-4xl font-black text-slate-800">
                                {reportStats.total || 0}
                            </span>
                            <span className="text-sm font-medium text-slate-500 mb-1">
                                total reports
                            </span>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <div className="flex-1 bg-rose-100/50 border border-rose-200 rounded-lg p-2 text-center">
                                <span className="block text-xl font-bold text-rose-700">
                                    {reportStats.byStatus?.pending || 0}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-rose-600">
                                    Action Req
                                </span>
                            </div>
                            <div className="flex-1 bg-emerald-100/50 border border-emerald-200 rounded-lg p-2 text-center">
                                <span className="block text-xl font-bold text-emerald-700">
                                    {reportStats.byStatus?.resolved || 0}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-emerald-600">
                                    Resolved
                                </span>
                            </div>
                        </div>

                        <div className="pt-2 border-t">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Reported Targets
                            </p>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Users</span>{" "}
                                <span className="font-medium">
                                    {reportStats.byTargetType?.user || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Posts</span>{" "}
                                <span className="font-medium">
                                    {reportStats.byTargetType?.post || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Requests</span>{" "}
                                <span className="font-medium">
                                    {reportStats.byTargetType
                                        ?.support_request || 0}
                                </span>
                            </div>
                        </div>
                    </StatCard>
                )}

                {categoryStats && (
                    <StatCard title="Categories Usage">
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-4xl font-black text-slate-800">
                                {categoryStats.total || 0}
                            </span>
                            <span className="text-sm font-medium text-slate-500 mb-1">
                                active categories
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Most Used
                            </p>
                            {(categoryStats.mostUsed || []).length > 0 ? (
                                <div className="space-y-2">
                                    {categoryStats.mostUsed.map((cat, idx) => (
                                        <div
                                            key={cat.id}
                                            className="flex justify-between items-center text-sm"
                                        >
                                            <span className="truncate pr-2">
                                                <span className="text-slate-400 mr-2">
                                                    #{idx + 1}
                                                </span>
                                                {cat.name}
                                            </span>
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-600">
                                                {cat.count} reqs
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    No usage data yet.
                                </p>
                            )}
                        </div>
                    </StatCard>
                )}

                {postStats && (
                    <StatCard title="Community Posts">
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-4xl font-black text-slate-800">
                                {postStats.total || 0}
                            </span>
                            <span className="text-sm font-medium text-slate-500 mb-1">
                                total posts
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    Active Posts
                                </p>
                                <p className="text-xs text-slate-500">
                                    Currently visible
                                </p>
                            </div>
                            <span className="text-xl font-bold text-emerald-600">
                                {postStats.byStatus?.active || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 mt-2 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    Removed Posts
                                </p>
                                <p className="text-xs text-slate-500">
                                    Via moderation
                                </p>
                            </div>
                            <span className="text-xl font-bold text-rose-600">
                                {postStats.byStatus?.inactive || 0}
                            </span>
                        </div>
                    </StatCard>
                )}
            </div>
        </>
    );
}

function StatCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 mb-4">{title}</h3>
            <div className="flex-1">{children}</div>
        </div>
    );
}
