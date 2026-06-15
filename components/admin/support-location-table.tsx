"use client";

import { SupportLocation } from "@/lib/admin-api";

interface SupportLocationTableProps {
    locations: SupportLocation[];
    processingId: string | null;
    onEdit: (location: SupportLocation) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export function SupportLocationTable({
    locations,
    processingId,
    onEdit,
    onToggleStatus,
}: SupportLocationTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-5 py-3 min-w-[200px]">
                            Location Info
                        </th>
                        <th className="px-5 py-3 min-w-[200px]">
                            Address & Contact
                        </th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {locations.map((loc) => {
                        const isProcessing = processingId === loc.id;

                        return (
                            <tr
                                key={loc.id}
                                className="hover:bg-slate-50 transition"
                            >
                                <td className="px-5 py-3 align-top">
                                    <p className="font-semibold text-slate-900">
                                        {loc.name}
                                    </p>
                                    <p
                                        className="text-xs text-slate-500 max-w-xs line-clamp-2 mt-1"
                                        title={loc.description}
                                    >
                                        {loc.description}
                                    </p>
                                    {(loc.bankName ||
                                        loc.bankAccountNumber) && (
                                        <div className="mt-2 text-[11px] bg-slate-100 p-1.5 rounded text-slate-600 font-medium inline-block">
                                            🏦 {loc.bankName} -{" "}
                                            {loc.bankAccountNumber}
                                        </div>
                                    )}
                                </td>

                                <td className="px-5 py-3 align-top">
                                    <p className="text-sm text-slate-700">
                                        {loc.address}
                                    </p>
                                    <p className="text-xs font-semibold text-emerald-700 mt-1">
                                        📞 {loc.contactPhone}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                        Lat: {loc.latitude} | Lng:{" "}
                                        {loc.longitude}
                                    </p>
                                </td>

                                <td className="px-5 py-3 align-top">
                                    <span
                                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${loc.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                                    >
                                        <span
                                            className={`size-1.5 rounded-full ${loc.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                                        ></span>
                                        {loc.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>

                                <td className="px-5 py-3 text-right align-top">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(loc)}
                                            disabled={isProcessing}
                                            className="text-xs font-semibold px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                onToggleStatus(
                                                    loc.id,
                                                    loc.isActive,
                                                )
                                            }
                                            disabled={isProcessing}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded transition disabled:opacity-50
                        ${loc.isActive ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                                        >
                                            {isProcessing
                                                ? "Wait..."
                                                : loc.isActive
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
