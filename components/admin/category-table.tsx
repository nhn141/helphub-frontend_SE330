"use client";

import { Category } from "@/lib/admin-api";

interface CategoryTableProps {
    categories: Category[];
    processingId: string | null;
    onEdit: (category: Category) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export function CategoryTable({
    categories,
    processingId,
    onEdit,
    onToggleStatus,
}: CategoryTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Code</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {categories.map((cat) => {
                        const isProcessing = processingId === cat.id;

                        return (
                            <tr
                                key={cat.id}
                                className="hover:bg-slate-50 transition"
                            >
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {cat.name}
                                            </p>
                                            <p
                                                className="text-xs text-slate-500 max-w-xs truncate"
                                                title={cat.description}
                                            >
                                                {cat.description}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-5 py-3">
                                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                        {cat.code}
                                    </span>
                                </td>

                                <td className="px-5 py-3">
                                    <span
                                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cat.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                                    >
                                        <span
                                            className={`size-1.5 rounded-full ${cat.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                                        ></span>
                                        {cat.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>

                                <td className="px-5 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(cat)}
                                            disabled={isProcessing}
                                            className="text-xs font-semibold px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                onToggleStatus(
                                                    cat.id,
                                                    cat.isActive,
                                                )
                                            }
                                            disabled={isProcessing}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded transition disabled:opacity-50
                        ${cat.isActive ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                                        >
                                            {isProcessing
                                                ? "Wait..."
                                                : cat.isActive
                                                  ? "Deactivate"
                                                  : "Activate"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
