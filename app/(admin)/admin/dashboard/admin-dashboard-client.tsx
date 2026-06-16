"use client";

import { useEffect, useState } from "react";
import { LoadingBlock, PageHeading } from "@/components/support-ui";
import {
    UserDashboardStats,
    SupportRequestDashboardStats,
    CategoryDashboardStats,
} from "@/lib/admin-api";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

const MOCK_USER_STATS: UserDashboardStats = {
    total: 1250,
    active: 1120,
    inactive: 130,
    byRole: {
        REQUESTER: 750,
        VOLUNTEER: 380,
        COLLABORATOR: 100,
        ADMIN: 20,
    },
};

const MOCK_SR_STATS: SupportRequestDashboardStats = {
    total: 580,
    byStatus: {
        PENDING: 140,
        APPROVED: 90,
        IN_PROGRESS: 180,
        COMPLETED: 170,
        REJECTED: 0,
        CANCELLED: 0,
    },
};

const MOCK_CATEGORY_STATS: CategoryDashboardStats = {
    total: 12,
    byStatus: {
        active: 10,
        inactive: 2,
    },
    mostUsed: [
        { id: "1", name: "Food & Supplies", count: 240 },
        { id: "2", name: "Medical & Healthcare", count: 150 },
        { id: "3", name: "Rescue & Evacuation", count: 110 },
        { id: "4", name: "Education Support", count: 80 },
    ],
};

const USER_GROWTH_DATA = [
    { name: "Oct", users: 450 },
    { name: "Nov", users: 620 },
    { name: "Dec", users: 890 },
    { name: "Jan", users: 1020 },
    { name: "Feb", users: 1150 },
    { name: "Mar", users: 1250 },
];

const COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#f43f5e",
    "#64748b",
];
const STATUS_COLORS = {
    PENDING: "#f59e0b",
    APPROVED: "#10b981",
    IN_PROGRESS: "#3b82f6",
    COMPLETED: "#64748b",
};

export function AdminDashboardClient() {
    const [loading, setLoading] = useState(true);

    const [userStats, setUserStats] = useState<UserDashboardStats | null>(null);
    const [requestStats, setRequestStats] =
        useState<SupportRequestDashboardStats | null>(null);
    const [categoryStats, setCategoryStats] =
        useState<CategoryDashboardStats | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setUserStats(MOCK_USER_STATS);
            setRequestStats(MOCK_SR_STATS);
            setCategoryStats(MOCK_CATEGORY_STATS);
            setLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    if (loading) return <LoadingBlock />;

    const userRoleData = userStats?.byRole
        ? Object.entries(userStats.byRole).map(([key, value]) => ({
              name: key,
              value,
          }))
        : [];

    const requestStatusData = requestStats?.byStatus
        ? Object.entries(requestStats.byStatus).map(([key, value]) => ({
              name: key,
              value,
          }))
        : [];

    const categoryData = categoryStats?.mostUsed
        ? categoryStats.mostUsed.map((cat) => ({
              name: cat.name,
              value: cat.count,
          }))
        : [];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex justify-between items-end">
                <PageHeading
                    eyebrow="System Overview"
                    title="Admin Dashboard"
                    description="High-level metrics and comprehensive statistics of the HelpHub network."
                />
            </div>

            <StatCard title="User Growth (Last 6 Months)">
                <div className="h-72 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={USER_GROWTH_DATA}
                            margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12, fill: "#64748b" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: "#64748b" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: "#f8fafc" }}
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "none",
                                    boxShadow:
                                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                            />
                            <Bar
                                dataKey="users"
                                fill="#10b981"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </StatCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {userStats && (
                    <StatCard title="System Users">
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Total Accounts
                                </p>
                                <span className="text-4xl font-black text-slate-800">
                                    {userStats.total}
                                </span>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                    Active: {userStats.active}
                                </div>
                                <div className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                                    Inactive: {userStats.inactive}
                                </div>
                            </div>
                        </div>

                        <div className="h-52 w-full mt-6 flex justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={userRoleData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {userRoleData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "none",
                                            boxShadow:
                                                "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                        }}
                                    />
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
                    </StatCard>
                )}

                {requestStats && (
                    <StatCard title="Support Requests (SR)">
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Total Requests Submitted
                                </p>
                                <span className="text-4xl font-black text-slate-800">
                                    {requestStats.total}
                                </span>
                            </div>
                        </div>

                        <div className="h-52 w-full mt-6 flex justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={requestStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {requestStatusData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        STATUS_COLORS[
                                                            entry.name as keyof typeof STATUS_COLORS
                                                        ] ||
                                                        COLORS[
                                                            index %
                                                                COLORS.length
                                                        ]
                                                    }
                                                />
                                            ),
                                        )}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "none",
                                            boxShadow:
                                                "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                        }}
                                    />
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
                    </StatCard>
                )}

                {categoryStats && (
                    <StatCard title="Relief Categories">
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Total Categories
                                </p>
                                <span className="text-4xl font-black text-slate-800">
                                    {categoryStats.total}
                                </span>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                    Active: {categoryStats.byStatus.active}
                                </div>
                                <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                    Inactive: {categoryStats.byStatus.inactive}
                                </div>
                            </div>
                        </div>

                        <div className="h-52 w-full mt-6 flex justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={75}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "none",
                                            boxShadow:
                                                "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                        }}
                                    />
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
                    </StatCard>
                )}
            </div>
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col hover:shadow-md transition duration-300">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                {title}
            </h3>
            <div className="flex-1">{children}</div>
        </div>
    );
}
