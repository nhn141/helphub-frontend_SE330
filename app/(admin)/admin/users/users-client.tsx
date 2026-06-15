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
    getUsersList,
    patchUserRole,
    patchUserStatus,
    UserSummary,
    UserRole,
} from "@/lib/admin-api";

export function UsersClient() {
    const { profile, getAccessToken } = useAuth();

    const [users, setUsers] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const [keyword, setKeyword] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");

    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getAccessToken();
            const response = await getUsersList(token, {
                keyword: keyword.trim() || undefined,
                role: roleFilter !== "ALL" ? roleFilter : undefined,
                page,
                size: 10,
                sort: "createdAt,desc",
            });

            setUsers(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (err: any) {
            setError(err.message || "Failed to load users list.");
        } finally {
            setLoading(false);
        }
    }, [getAccessToken, keyword, roleFilter, page]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setKeyword(searchInput);
        setPage(0);
    };

    const handleRoleChange = async (
        userId: string,
        currentRole: UserRole,
        newRole: UserRole,
    ) => {
        if (currentRole === newRole) return;

        if (newRole === "ADMIN") {
            const confirm = window.confirm(
                "Are you sure you want to grant Administrator privileges to this user?",
            );
            if (!confirm) return;
        }

        setProcessingId(userId);
        try {
            const token = await getAccessToken();
            await patchUserRole(token, userId, { role: newRole });

            setUsers(
                users.map((u) =>
                    u.id === userId ? { ...u, role: newRole } : u,
                ),
            );
        } catch (err: any) {
            alert(`Failed to change role: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleStatusToggle = async (
        userId: string,
        currentStatus: boolean,
    ) => {
        const action = currentStatus ? "deactivate" : "activate";
        const confirm = window.confirm(
            `Are you sure you want to ${action} this account?`,
        );
        if (!confirm) return;

        setProcessingId(userId);
        try {
            const token = await getAccessToken();
            await patchUserStatus(token, userId, { isActive: !currentStatus });

            setUsers(
                users.map((u) =>
                    u.id === userId ? { ...u, isActive: !currentStatus } : u,
                ),
            );
        } catch (err: any) {
            alert(`Failed to change status: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <>
            <PageHeading
                eyebrow="Management"
                title="Users"
                description="Manage accounts, assign roles, and moderate access across the platform."
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <form
                        onSubmit={handleSearch}
                        className="flex-1 w-full max-w-md relative"
                    >
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </form>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(
                                    e.target.value as UserRole | "ALL",
                                );
                                setPage(0);
                            }}
                            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="REQUESTER">Requester</option>
                            <option value="VOLUNTEER">Volunteer</option>
                            <option value="COLLABORATOR">Collaborator</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
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
                ) : users.length === 0 ? (
                    <div className="py-8 border-t border-slate-100">
                        <EmptyState
                            title="No users found"
                            description="Try adjusting your search or role filter."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3">User</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Joined</th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => {
                                    const isMe = profile?.id === user.id;
                                    const isProcessing =
                                        processingId === user.id;

                                    return (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-slate-50 transition"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                                                        {user.avatarUrl ? (
                                                            <img
                                                                src={
                                                                    user.avatarUrl
                                                                }
                                                                alt={
                                                                    user.fullName
                                                                }
                                                                className="size-full object-cover"
                                                            />
                                                        ) : (
                                                            user.fullName
                                                                .charAt(0)
                                                                .toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                                                            {user.fullName}
                                                            {isMe && (
                                                                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                                                    YOU
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3">
                                                <select
                                                    value={user.role}
                                                    disabled={
                                                        isMe || isProcessing
                                                    }
                                                    onChange={(e) =>
                                                        handleRoleChange(
                                                            user.id,
                                                            user.role,
                                                            e.target
                                                                .value as UserRole,
                                                        )
                                                    }
                                                    className={`text-xs font-semibold px-2 py-1 rounded border-0 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500
                            ${
                                user.role === "ADMIN"
                                    ? "bg-amber-100 text-amber-800"
                                    : user.role === "COLLABORATOR"
                                      ? "bg-blue-100 text-blue-800"
                                      : user.role === "VOLUNTEER"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-slate-100 text-slate-800"
                            }`}
                                                >
                                                    <option value="REQUESTER">
                                                        Requester
                                                    </option>
                                                    <option value="VOLUNTEER">
                                                        Volunteer
                                                    </option>
                                                    <option value="COLLABORATOR">
                                                        Collaborator
                                                    </option>
                                                    <option value="ADMIN">
                                                        Admin
                                                    </option>
                                                </select>
                                            </td>

                                            <td className="px-5 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                                                >
                                                    <span
                                                        className={`size-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                                                    ></span>
                                                    {user.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 text-xs">
                                                {new Date(
                                                    user.createdAt,
                                                ).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() =>
                                                        handleStatusToggle(
                                                            user.id,
                                                            user.isActive,
                                                        )
                                                    }
                                                    disabled={
                                                        isMe || isProcessing
                                                    }
                                                    className={`text-xs font-semibold px-3 py-1.5 rounded transition
                            ${
                                isMe
                                    ? "text-slate-300 cursor-not-allowed"
                                    : user.isActive
                                      ? "text-rose-600 hover:bg-rose-50"
                                      : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                                                >
                                                    {isProcessing
                                                        ? "Wait..."
                                                        : user.isActive
                                                          ? "Lock"
                                                          : "Unlock"}
                                                </button>
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
                            Showing page{" "}
                            <span className="font-semibold text-slate-700">
                                {page + 1}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-700">
                                {totalPages}
                            </span>{" "}
                            ({totalElements} users)
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

function SearchIcon() {
    return (
        <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
        </svg>
    );
}
