"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import {
    getMyConversations,
    createPrivateConversationByEmail,
    ConversationSummaryResponse,
} from "@/lib/chat-api";

interface InboxSidebarProps {
    activeId: string | null;
    onSelect: (id: string) => void;
}

export function InboxSidebar({ activeId, onSelect }: InboxSidebarProps) {
    const { getAccessToken, profile } = useAuth();
    const [conversations, setConversations] = useState<
        ConversationSummaryResponse[]
    >([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetEmail, setTargetEmail] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const fetchInbox = useCallback(async () => {
        try {
            const token = await getAccessToken();
            const res = await getMyConversations(token);
            setConversations(res);
        } catch (error) {
            console.error("Failed to load inbox", error);
        } finally {
            setLoading(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        fetchInbox();
    }, [fetchInbox]);

    const handleCreateChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetEmail.trim()) return;

        setIsCreating(true);
        setModalError(null);
        try {
            const token = await getAccessToken();
            const newConv = await createPrivateConversationByEmail(
                token,
                targetEmail.trim(),
            );

            await fetchInbox();
            onSelect(newConv.id);

            setIsModalOpen(false);
            setTargetEmail("");
        } catch (err: any) {
            setModalError(
                err.message || "User not found or failed to start chat.",
            );
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-800">Messages</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition"
                        title="New Chat"
                    >
                        <PlusIcon />
                    </button>
                    <button
                        onClick={fetchInbox}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition"
                        title="Refresh inbox"
                    >
                        🔄
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                {loading ? (
                    <div className="p-4 text-center text-slate-400 text-sm animate-pulse">
                        Loading messages...
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                        <span className="text-3xl">📭</span>
                        <p>No conversations yet.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                        >
                            Start a conversation
                        </button>
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const isActive = activeId === conv.id;
                        const isUnread = conv.unreadCount > 0;

                        let displayName = conv.name;
                        let displayAvatar = conv.avatarUrl;

                        if (conv.type === "PRIVATE" && conv.members) {
                            const otherUser = conv.members.find(
                                (m) => m.userId !== profile?.id,
                            );
                            if (otherUser) {
                                displayName = otherUser.fullName;
                                displayAvatar = otherUser.avatarUrl;
                            }
                        }

                        const finalName = displayName || "Unknown User";

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition ${
                                    isActive
                                        ? "bg-emerald-50 border border-emerald-100"
                                        : "hover:bg-slate-50 border border-transparent"
                                }`}
                            >
                                <div className="relative size-12 rounded-full flex-shrink-0 bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-500">
                                    {displayAvatar ? (
                                        <img
                                            src={displayAvatar}
                                            alt={finalName}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        finalName.charAt(0).toUpperCase()
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3
                                            className={`text-sm truncate ${isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}
                                        >
                                            {finalName}
                                        </h3>
                                        <span
                                            className={`text-[10px] whitespace-nowrap ml-2 ${isUnread ? "text-emerald-600 font-semibold" : "text-slate-400"}`}
                                        >
                                            {conv.updatedAt
                                                ? new Date(
                                                      conv.updatedAt,
                                                  ).toLocaleDateString(
                                                      undefined,
                                                      {
                                                          month: "short",
                                                          day: "numeric",
                                                      },
                                                  )
                                                : ""}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p
                                            className={`text-xs truncate ${isUnread ? "font-semibold text-slate-800" : "text-slate-500"}`}
                                        >
                                            {isUnread ? (
                                                "New message received"
                                            ) : (
                                                <span className="italic text-slate-400">
                                                    Tap to view chat
                                                </span>
                                            )}
                                        </p>
                                        {isUnread && (
                                            <span className="ml-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                {conv.unreadCount > 99
                                                    ? "99+"
                                                    : conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-5 animate-in fade-in zoom-in-95 duration-150">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            New Conversation
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Enter the email address of the user you want to chat
                            with.
                        </p>

                        <form onSubmit={handleCreateChat} className="space-y-4">
                            {modalError && (
                                <div className="p-2.5 text-xs text-rose-600 bg-rose-50 rounded-lg border border-rose-100">
                                    {modalError}
                                </div>
                            )}
                            <div>
                                <input
                                    type="email"
                                    required
                                    disabled={isCreating}
                                    placeholder="user@example.com"
                                    value={targetEmail}
                                    onChange={(e) =>
                                        setTargetEmail(e.target.value)
                                    }
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    disabled={isCreating}
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setTargetEmail("");
                                        setModalError(null);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !targetEmail.trim()}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition"
                                >
                                    {isCreating ? "Creating..." : "Start Chat"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlusIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );
}
