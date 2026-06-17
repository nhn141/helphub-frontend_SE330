"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { InboxSidebar } from "@/components/chat/inbox-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";

type MessagesClientProps = {
    initialConversationId?: string | null;
};

export function MessagesClient({
    initialConversationId = null,
}: MessagesClientProps) {
    const router = useRouter();
    const [activeConversationId, setActiveConversationId] = useState<
        string | null
    >(initialConversationId);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setActiveConversationId(initialConversationId);
        }, 0);

        return () => window.clearTimeout(timer);
    }, [initialConversationId]);

    const handleSelectConversation = useCallback(
        (id: string) => {
            setActiveConversationId(id);
            router.replace(`/messages?conversationId=${encodeURIComponent(id)}`, {
                scroll: false,
            });
        },
        [router],
    );

    const handleCloseConversation = useCallback(() => {
        setActiveConversationId(null);
        router.replace("/messages", { scroll: false });
    }, [router]);

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div
                className={`w-full md:w-[320px] lg:w-[380px] border-r border-slate-200 flex flex-col flex-shrink-0 ${
                    activeConversationId ? "hidden md:flex" : "flex"
                }`}
            >
                <InboxSidebar
                    activeId={activeConversationId}
                    onSelect={handleSelectConversation}
                />
            </div>

            <div
                className={`w-full flex-1 bg-slate-50 flex-col relative ${
                    !activeConversationId ? "hidden md:flex" : "flex"
                }`}
            >
                {activeConversationId ? (
                    <ChatWindow
                        conversationId={activeConversationId}
                        onBack={handleCloseConversation}
                    />
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
