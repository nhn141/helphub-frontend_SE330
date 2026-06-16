"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import {
    getMyConversations,
    ConversationSummaryResponse,
} from "@/lib/chat-api";

interface InboxSidebarProps {
    activeId: string | null;
    onSelect: (id: string) => void;
}

export function InboxSidebar({ activeId, onSelect }: InboxSidebarProps) {
    const { getAccessToken } = useAuth();
    const [conversations, setConversations] = useState<
        ConversationSummaryResponse[]
    >([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-800">Messages</h2>
                <button
                    onClick={fetchInbox}
                    className="text-slate-400 hover:text-emerald-600 transition"
                    title="Refresh inbox"
                >
                    🔄
                </button>
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
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const isActive = activeId === conv.id;
                        const isUnread = conv.unreadCount > 0;

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
                                    {conv.avatarUrl ? (
                                        <img
                                            src={conv.avatarUrl}
                                            alt={conv.name}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        conv.name.charAt(0).toUpperCase()
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3
                                            className={`text-sm truncate ${isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}
                                        >
                                            {conv.name}
                                        </h3>
                                        <span
                                            className={`text-[10px] whitespace-nowrap ml-2 ${isUnread ? "text-emerald-600 font-semibold" : "text-slate-400"}`}
                                        >
                                            {conv.lastMessage
                                                ? new Date(
                                                      conv.lastMessage
                                                          .createdAt,
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
                                            {conv.lastMessage?.content || (
                                                <span className="italic">
                                                    Attachment sent
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
        </div>
    );
}
