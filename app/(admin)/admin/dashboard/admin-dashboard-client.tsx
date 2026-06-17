"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { useAuth } from "@/components/auth-provider";
import { LoadingBlock, Notice, PageHeading } from "@/components/support-ui";
import {
    getAdminDashboardCategories,
    getAdminDashboardPosts,
    getAdminDashboardReports,
    getAdminDashboardSupportRequests,
    getAdminDashboardUsers,
    type CategoryDashboardStats,
    type PostDashboardStats,
    type ReportDashboardStats,
    type SupportRequestDashboardStats,
    type UserDashboardStats,
} from "@/lib/admin-api";

type ChartItem = {
    name: string;
    value: number;
    color?: string;
};

const COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#f43f5e",
    "#64748b",
    "#14b8a6",
];

const REQUEST_STATUS_COLORS: Record<string, string> = {
    Pending: "#f59e0b",
    Approved: "#10b981",
    "In progress": "#3b82f6",
    Completed: "#64748b",
    Rejected: "#f43f5e",
    Cancelled: "#94a3b8",
};

const REPORT_STATUS_COLORS: Record<string, string> = {
    Pending: "#f59e0b",
    Reviewed: "#3b82f6",
    Resolved: "#10b981",
};

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
    const [reportStats, setReportStats] =
        useState<ReportDashboardStats | null>(null);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await getAccessToken();
            const [users, requests, categories, posts, reports] =
                await Promise.all([
                    getAdminDashboardUsers(token),
                    getAdminDashboardSupportRequests(token),
                    getAdminDashboardCategories(token),
                    getAdminDashboardPosts(token),
                    getAdminDashboardReports(token),
                ]);

            setUserStats(users);
            setRequestStats(requests);
            setCategoryStats(categories);
            setPostStats(posts);
            setReportStats(reports);
        } catch (loadError) {
            setError(getErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadDashboard();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [loadDashboard]);

    const userRoleData = useMemo<ChartItem[]>(
        () =>
            userStats
                ? [
                      {
                          name: "Requesters",
                          value: userStats.requesters,
                      },
                      {
                          name: "Volunteers",
                          value: userStats.volunteers,
                      },
                      {
                          name: "Collaborators",
                          value: userStats.collaborators,
                      },
                      { name: "Admins", value: userStats.admins },
                  ]
                : [],
        [userStats],
    );

    const requestStatusData = useMemo<ChartItem[]>(
        () =>
            requestStats
                ? [
                      { name: "Pending", value: requestStats.pending },
                      { name: "Approved", value: requestStats.approved },
                      {
                          name: "In progress",
                          value: requestStats.inProgress,
                      },
                      { name: "Completed", value: requestStats.completed },
                      { name: "Rejected", value: requestStats.rejected },
                      { name: "Cancelled", value: requestStats.cancelled },
                  ].map((item) => ({
                      ...item,
                      color: REQUEST_STATUS_COLORS[item.name],
                  }))
                : [],
        [requestStats],
    );

    const categoryData = useMemo<ChartItem[]>(
        () =>
            categoryStats?.categories.map((category) => ({
                name: category.categoryName,
                value: category.supportRequestCount,
            })) ?? [],
        [categoryStats],
    );

    const postStatusData = useMemo<ChartItem[]>(
        () =>
            postStats
                ? [
                      { name: "Active", value: postStats.active },
                      { name: "Under review", value: postStats.underReview },
                      { name: "Hidden", value: postStats.hidden },
                      { name: "Removed", value: postStats.removed },
                  ]
                : [],
        [postStats],
    );

    const reportStatusData = useMemo<ChartItem[]>(
        () =>
            reportStats
                ? [
                      {
                          name: "Pending",
                          value: reportStats.pending,
                          color: REPORT_STATUS_COLORS.Pending,
                      },
                      {
                          name: "Reviewed",
                          value: reportStats.reviewed,
                          color: REPORT_STATUS_COLORS.Reviewed,
                      },
                      {
                          name: "Resolved",
                          value: reportStats.resolved,
                          color: REPORT_STATUS_COLORS.Resolved,
                      },
                  ]
                : [],
        [reportStats],
    );

    const reportTargetData = useMemo<ChartItem[]>(
        () =>
            reportStats
                ? [
                      {
                          name: "Support requests",
                          value: reportStats.supportRequestReports,
                      },
                      { name: "Posts", value: reportStats.postReports },
                      { name: "Users", value: reportStats.userReports },
                  ]
                : [],
        [reportStats],
    );

    if (loading) {
        return <LoadingBlock message="Loading admin dashboard..." />;
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <PageHeading
                    eyebrow="System Overview"
                    title="Admin Dashboard"
                    description="Live metrics from the HelpHub backend."
                />
                <button
                    type="button"
                    onClick={() => void loadDashboard()}
                    className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Refresh
                </button>
            </div>

            {error ? (
                <Notice type="error">
                    {error}{" "}
                    <button
                        type="button"
                        onClick={() => void loadDashboard()}
                        className="font-semibold underline"
                    >
                        Try again
                    </button>
                </Notice>
            ) : null}

            {userStats && requestStats && categoryStats && postStats && reportStats ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <KpiCard
                            title="Users"
                            value={userStats.totalUsers}
                            detail={`${userStats.activeUsers} active`}
                        />
                        <KpiCard
                            title="Support requests"
                            value={requestStats.totalSupportRequests}
                            detail={`${requestStats.pending} pending review`}
                        />
                        <KpiCard
                            title="Categories"
                            value={categoryStats.totalCategories}
                            detail={`${categoryStats.activeCategories} active`}
                        />
                        <KpiCard
                            title="Posts"
                            value={postStats.totalPosts}
                            detail={`${postStats.underReview} under review`}
                        />
                        <KpiCard
                            title="Reports"
                            value={reportStats.totalReports}
                            detail={`${reportStats.pending} pending`}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <StatCard title="System Users">
                            <div className="mt-2 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                        Total accounts
                                    </p>
                                    <span className="text-4xl font-black text-slate-800">
                                        {userStats.totalUsers}
                                    </span>
                                </div>
                                <div className="space-y-1 text-right">
                                    <Badge tone="emerald">
                                        Active: {userStats.activeUsers}
                                    </Badge>
                                    <Badge tone="rose">
                                        Inactive: {userStats.inactiveUsers}
                                    </Badge>
                                </div>
                            </div>

                            <PiePanel data={userRoleData} />
                        </StatCard>

                        <StatCard title="Support Requests">
                            <div className="mt-2">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                    Total submitted
                                </p>
                                <span className="text-4xl font-black text-slate-800">
                                    {requestStats.totalSupportRequests}
                                </span>
                            </div>

                            <PiePanel data={requestStatusData} />
                        </StatCard>

                        <StatCard title="Reports">
                            <div className="mt-2">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                    Moderation queue
                                </p>
                                <span className="text-4xl font-black text-slate-800">
                                    {reportStats.totalReports}
                                </span>
                            </div>

                            <PiePanel data={reportStatusData} />
                        </StatCard>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <StatCard title="Requests by Category">
                            <BarPanel
                                data={categoryData}
                                emptyMessage="No support requests by category yet."
                            />
                        </StatCard>

                        <StatCard title="Posts by Status">
                            <BarPanel
                                data={postStatusData}
                                emptyMessage="No post data yet."
                            />
                        </StatCard>

                        <StatCard title="Reports by Target">
                            <BarPanel
                                data={reportTargetData}
                                emptyMessage="No report target data yet."
                            />
                        </StatCard>
                    </div>
                </>
            ) : null}
        </div>
    );
}

function KpiCard({
    title,
    value,
    detail,
}: {
    title: string;
    value: number;
    detail: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {title}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
        </div>
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
        <section className="flex min-h-[360px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
            <h3 className="border-b border-slate-100 pb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
                {title}
            </h3>
            <div className="min-h-0 flex-1">{children}</div>
        </section>
    );
}

function PiePanel({ data }: { data: ChartItem[] }) {
    const visibleData = data.filter((item) => item.value > 0);

    if (!visibleData.length) {
        return <EmptyChart message="No data to display yet." />;
    }

    return (
        <div className="mt-6 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={visibleData}
                        cx="50%"
                        cy="50%"
                        dataKey="value"
                        innerRadius={55}
                        outerRadius={78}
                        paddingAngle={4}
                    >
                        {visibleData.map((entry, index) => (
                            <Cell
                                key={entry.name}
                                fill={
                                    entry.color ??
                                    COLORS[index % COLORS.length]
                                }
                            />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                        iconType="circle"
                        wrapperStyle={{
                            fontSize: "11px",
                            paddingTop: "10px",
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

function BarPanel({
    data,
    emptyMessage,
}: {
    data: ChartItem[];
    emptyMessage: string;
}) {
    const visibleData = data.filter((item) => item.value > 0);

    if (!visibleData.length) {
        return <EmptyChart message={emptyMessage} />;
    }

    return (
        <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={visibleData}
                    margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
                >
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                        {visibleData.map((entry, index) => (
                            <Cell
                                key={entry.name}
                                fill={
                                    entry.color ??
                                    COLORS[index % COLORS.length]
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function EmptyChart({ message }: { message: string }) {
    return (
        <div className="mt-6 flex h-56 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
            {message}
        </div>
    );
}

function Badge({
    tone,
    children,
}: {
    tone: "emerald" | "rose";
    children: React.ReactNode;
}) {
    const className =
        tone === "emerald"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700";

    return (
        <div className={`rounded px-2 py-1 text-[11px] font-bold ${className}`}>
            {children}
        </div>
    );
}

const tooltipStyle = {
    border: "none",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgb(15 23 42 / 0.12)",
} satisfies React.CSSProperties;

function getErrorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : "Unable to load admin dashboard.";
}
