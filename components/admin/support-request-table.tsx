"use client";

import { SupportRequestSummary } from "@/lib/api";
import { SupportLocation } from "@/lib/admin-api";
import { SUPPORT_REQUEST_STATUS_LABELS } from "@/lib/support-request-ui";

interface SupportRequestTableProps {
    requests: SupportRequestSummary[];
    locations: SupportLocation[];
    processingId: string | null;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onAssignLocation: (id: string, locationId: string) => void;
}

export function SupportRequestTable({
    requests,
    locations,
    processingId,
    onApprove,
    onReject,
    onAssignLocation,
}: SupportRequestTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-5 py-3 min-w-[250px]">
                            Request Info
                        </th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3 min-w-[180px]">
                            Actions / Location
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => {
                        const isProcessing = processingId === req.id;

                        return (
                            <tr
                                key={req.id}
                                className="hover:bg-slate-50 transition"
                            >
                                <td className="px-5 py-3">
                                    <p
                                        className="font-semibold text-slate-900 truncate max-w-[250px]"
                                        title={req.title}
                                    >
                                        {req.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        By: {req.requesterName}
                                    </p>
                                </td>

                                <td className="px-5 py-3">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold">
                                        {req.categoryName}
                                    </span>
                                </td>

                                <td className="px-5 py-3">
                                    <span
                                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded
                          ${
                              req.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : req.status === "APPROVED" ||
                                      req.status === "IN_PROGRESS"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : req.status === "REJECTED" ||
                                        req.status === "CANCELLED"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-blue-100 text-blue-800"
                          }`}
                                    >
                                        {SUPPORT_REQUEST_STATUS_LABELS[
                                            req.status
                                        ] || req.status}
                                    </span>
                                </td>

                                <td className="px-5 py-3 text-xs">
                                    {new Date(
                                        req.createdAt,
                                    ).toLocaleDateString()}
                                </td>

                                <td className="px-5 py-3">
                                    {req.status === "PENDING" && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    onApprove(req.id)
                                                }
                                                disabled={isProcessing}
                                                className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => onReject(req.id)}
                                                disabled={isProcessing}
                                                className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded hover:bg-rose-100 disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}

                                    {(req.status === "APPROVED" ||
                                        req.status === "IN_PROGRESS") && (
                                        <select
                                            disabled={isProcessing}
                                            onChange={(e) =>
                                                onAssignLocation(
                                                    req.id,
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-2 py-1.5 text-xs border border-emerald-300 rounded bg-emerald-50 text-emerald-800 outline-none focus:ring-1 focus:ring-emerald-500"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>
                                                -- Assign Location --
                                            </option>
                                            {locations.map((loc) => (
                                                <option
                                                    key={loc.id}
                                                    value={loc.id}
                                                >
                                                    {loc.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {req.status !== "PENDING" &&
                                        req.status !== "APPROVED" &&
                                        req.status !== "IN_PROGRESS" && (
                                            <span className="text-xs italic text-slate-400">
                                                Action completed
                                            </span>
                                        )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
