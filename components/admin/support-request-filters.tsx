"use client";

import { SupportRequestStatus } from "@/lib/api";
import { Category } from "@/lib/admin-api";

interface SupportRequestFiltersProps {
    statusFilter: SupportRequestStatus | "ALL";
    setStatusFilter: (status: SupportRequestStatus | "ALL") => void;
    categoryFilter: string;
    setCategoryFilter: (categoryId: string) => void;
    categories: Category[];
    onRefresh: () => void;
}

export function SupportRequestFilters({
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    onRefresh,
}: SupportRequestFiltersProps) {
    return (
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-3 flex-wrap">
            <select
                value={statusFilter}
                onChange={(e) =>
                    setStatusFilter(
                        e.target.value as SupportRequestStatus | "ALL",
                    )
                }
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[150px]"
            >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending (Action Req)</option>
                <option value="APPROVED">Approved (Need Location)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
            </select>

            <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[150px]"
            >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                ))}
            </select>

            <button
                onClick={onRefresh}
                className="px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
                Refresh
            </button>
        </div>
    );
}
