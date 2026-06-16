"use client";

import { useState } from "react";
import { InboxSidebar } from "@/components/chat/inbox-sidebar";

export function MessagesClient() {
    const [activeConversationId, setActiveConversationId] = useState<
        string | null
    >(null);

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div
                className={`w-full md:w-[320px] lg:w-[380px] border-r border-slate-200 flex flex-col flex-shrink-0 ${
                    activeConversationId ? "hidden md:flex" : "flex"
                }`}
            >
                <InboxSidebar
                    activeId={activeConversationId}
                    onSelect={(id) => setActiveConversationId(id)}
                />
            </div>

            <div
                className={`w-full flex-1 bg-slate-50 flex-col relative ${
                    !activeConversationId ? "hidden md:flex" : "flex"
                }`}
            >
                {activeConversationId ? (
                    <div className="flex items-center justify-center h-full text-slate-500 flex-col">
                        <span className="text-4xl animate-bounce mb-3">🛠️</span>
                        <p className="font-medium text-slate-700">
                            Real-time Chat Window is under construction...
                        </p>
                        <p className="text-xs mt-2">
                            Conversation ID: {activeConversationId}
                        </p>

                        <button
                            className="md:hidden mt-4 text-emerald-600 font-semibold bg-emerald-50 px-4 py-2 rounded-lg"
                            onClick={() => setActiveConversationId(null)}
                        >
                            ← Back to Inbox
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-3">
                        <span className="text-5xl opacity-50">💬</span>
                        <p className="font-medium text-slate-500">
                            Select a conversation to start messaging
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
