"use client";

import { Report } from "@/lib/admin-api";

interface ReportTableProps {
    reports: Report[];
    onActionClick: (report: Report) => void;
}

export function ReportTable({ reports, onActionClick }: ReportTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-5 py-3">Report Target</th>
                        <th className="px-5 py-3">Violation Reason</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {reports.map((report) => (
                        <tr
                            key={report.id}
                            className="hover:bg-slate-50 transition"
                        >
                            <td className="px-5 py-3">
                                <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1
                  ${
                      report.targetType === "USER"
                          ? "bg-blue-100 text-blue-800"
                          : report.targetType === "POST"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                  }`}
                                >
                                    {report.targetType}
                                </span>
                                <p
                                    className="text-xs text-slate-500 font-mono"
                                    title={report.targetId}
                                >
                                    ID: {report.targetId.substring(0, 8)}...
                                </p>
                            </td>

                            <td className="px-5 py-3">
                                <p className="font-semibold text-rose-700">
                                    {report.reason}
                                </p>
                                <p className="text-xs text-slate-500">
                                    By: {report.reporterName}
                                </p>
                            </td>

                            <td className="px-5 py-3">
                                <span
                                    className={`text-[10px] uppercase font-bold px-2 py-1 rounded
                  ${
                      report.status === "PENDING"
                          ? "bg-rose-100 text-rose-800"
                          : report.status === "REVIEWED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-200 text-slate-600"
                  }`}
                                >
                                    {report.status}
                                </span>
                            </td>

                            <td className="px-5 py-3 text-xs">
                                {new Date(
                                    report.createdAt,
                                ).toLocaleDateString()}
                            </td>

                            <td className="px-5 py-3 text-right">
                                <button
                                    onClick={() => onActionClick(report)}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded transition
                    ${
                        report.status === "RESOLVED"
                            ? "text-slate-500 hover:bg-slate-100 border border-slate-200"
                            : "text-rose-600 hover:bg-rose-50 border border-rose-200 bg-white"
                    }`}
                                >
                                    {report.status === "RESOLVED"
                                        ? "View"
                                        : "Review"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
