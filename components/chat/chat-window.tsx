"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import { useAuth } from "@/components/auth-provider";
import {
    getConversationMessages,
    sendMessage,
    MessageResponse,
    markMessageAsRead,
    createMediaRecord,
    getConversationById,
    addMemberToConversation,
    getMyConversations,
    ConversationSummaryResponse,
} from "@/lib/chat-api";

interface ChatWindowProps {
    conversationId: string;
    onBack: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const { getAccessToken, profile } = useAuth();

    const [messages, setMessages] = useState<MessageResponse[]>([]);
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [conversationDetail, setConversationDetail] =
        useState<ConversationSummaryResponse | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [suggestedUsers, setSuggestedUsers] = useState<
        {
            id: string;
            fullName: string;
            email: string;
            avatarUrl: string | null;
        }[]
    >([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isAddingUser, setIsAddingUser] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const stompClientRef = useRef<Client | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleMarkAsRead = async (messageList: MessageResponse[]) => {
        if (!profile?.id) return;
        const lastOtherMsg = [...messageList]
            .reverse()
            .find((m) => m.senderId !== profile.id);

        if (lastOtherMsg && !lastOtherMsg.id.startsWith("temp-")) {
            try {
                const token = await getAccessToken();
                await markMessageAsRead(token, conversationId, lastOtherMsg.id);
            } catch (err) {
                console.error("Failed to mark as read", err);
            }
        }
    };

    const fetchHistoryAndDetail = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAccessToken();
            const [msgRes, detailRes] = await Promise.all([
                getConversationMessages(token, conversationId),
                getConversationById(token, conversationId),
            ]);

            setMessages(msgRes);
            setConversationDetail(detailRes);
            handleMarkAsRead(msgRes);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error("Failed to fetch chat data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, getAccessToken]);

    useEffect(() => {
        fetchHistoryAndDetail();

        let client: Client;
        const connectWebSocket = async () => {
            const token = await getAccessToken();
            const wsUrl =
                process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081/ws";

            client = new Client({
                brokerURL: wsUrl,
                connectHeaders: { Authorization: `Bearer ${token}` },
                reconnectDelay: 5000,
            });

            client.onConnect = () => {
                client.subscribe("/user/queue/messages", (message) => {
                    const payload = JSON.parse(message.body);

                    if (
                        payload.eventType === "MESSAGE_CREATED" &&
                        payload.message
                    ) {
                        const newMsg: MessageResponse = payload.message;
                        if (newMsg.conversationId === conversationId) {
                            setMessages((prev) => {
                                if (prev.some((m) => m.id === newMsg.id))
                                    return prev;
                                return [...prev, newMsg];
                            });
                            if (newMsg.senderId !== profile?.id) {
                                handleMarkAsRead([newMsg]);
                            }
                            setTimeout(scrollToBottom, 100);
                        }
                    }
                });
            };

            client.activate();
            stompClientRef.current = client;
        };

        connectWebSocket();

        return () => {
            if (stompClientRef.current) stompClientRef.current.deactivate();
        };
    }, [conversationId, fetchHistoryAndDetail, getAccessToken]);

    useEffect(() => {
        if (!isAddModalOpen) return;

        const loadSuggestions = async () => {
            setIsLoadingSuggestions(true);
            try {
                const token = await getAccessToken();
                const myInboxes = await getMyConversations(token);

                const userMap = new Map<string, any>();

                myInboxes.forEach((conv) => {
                    if (conv.type === "PRIVATE" && conv.members) {
                        const otherMember = conv.members.find(
                            (m) => m.userId !== profile?.id,
                        );
                        if (otherMember) {
                            userMap.set(otherMember.userId, {
                                id: otherMember.userId,
                                fullName: otherMember.fullName,
                                email: otherMember.email,
                                avatarUrl: otherMember.avatarUrl,
                            });
                        }
                    }
                });

                const existingMemberIds =
                    conversationDetail?.members?.map((m) => m.userId) || [];
                const finalFilteredUsers = Array.from(userMap.values()).filter(
                    (user) => !existingMemberIds.includes(user.id),
                );

                setSuggestedUsers(finalFilteredUsers);
            } catch (err) {
                console.error("Failed to load suggested contacts", err);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        loadSuggestions();
    }, [isAddModalOpen, getAccessToken, profile?.id, conversationDetail]);

    const handleAddMember = async (userId: string) => {
        setIsAddingUser(userId);
        try {
            const token = await getAccessToken();
            await addMemberToConversation(token, conversationId, userId);

            const freshDetail = await getConversationById(
                token,
                conversationId,
            );
            setConversationDetail(freshDetail);

            setSuggestedUsers((prev) => prev.filter((u) => u.id !== userId));
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Failed to add member", error);
            alert("Failed to add user to group.");
        } finally {
            setIsAddingUser(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles((prev) => [...prev, ...filesArray]);
            const newPreviews = filesArray.map((file) =>
                URL.createObjectURL(file),
            );
            setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const removePreview = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index]);
            newPreviews.splice(index, 1);
            return newPreviews;
        });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && selectedFiles.length === 0) return;

        setIsSending(true);
        try {
            const token = await getAccessToken();
            const tempId = `temp-${Date.now()}`;

            const optimisticMedia = selectedFiles.map((file, idx) => ({
                id: `temp-media-${idx}`,
                fileName: file.name,
                fileUrl: imagePreviews[idx],
                fileType: "IMAGE",
                mimeType: file.type,
                fileSize: file.size,
                altText: null,
            }));

            const optimisticMsg: MessageResponse = {
                id: tempId,
                conversationId,
                senderId: profile?.id || "",
                senderName: profile?.fullName || "Me",
                senderAvatarUrl: profile?.avatarUrl || null,
                content: content.trim(),
                media: optimisticMedia,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                editedAt: null,
            };

            setMessages((prev) => [...prev, optimisticMsg]);

            const currentText = content.trim();
            const currentFiles = [...selectedFiles];
            setContent("");
            setSelectedFiles([]);
            setImagePreviews([]);
            scrollToBottom();

            let uploadedMediaIds: string[] = [];

            if (currentFiles.length > 0) {
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                const uploadPreset =
                    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

                if (!cloudName || !uploadPreset)
                    throw new Error("Missing Cloudinary configuration");

                for (const file of currentFiles) {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("upload_preset", uploadPreset);

                    const res = await fetch(
                        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                        {
                            method: "POST",
                            body: formData,
                        },
                    );

                    if (!res.ok) throw new Error("Cloudinary upload failed");
                    const cloudData = await res.json();

                    const mediaRecord = await createMediaRecord(token, {
                        fileName: file.name,
                        fileUrl: cloudData.secure_url,
                        fileType: "IMAGE",
                        mimeType: file.type || "image/jpeg",
                        fileSize: cloudData.bytes,
                        altText: null,
                        isPublic: true,
                    });

                    uploadedMediaIds.push(mediaRecord.id);
                }
            }

            const finalContent =
                currentText ||
                (uploadedMediaIds.length > 0 ? "🖼️ [Attachment]" : "");

            const realMsg = await sendMessage(token, conversationId, {
                content: finalContent,
                mediaIds: uploadedMediaIds,
            });

            setMessages((prev) => {
                const isAlreadyInState = prev.some((m) => m.id === realMsg.id);
                if (isAlreadyInState) {
                    return prev.filter((m) => m.id !== tempId);
                } else {
                    return prev.map((m) => (m.id === tempId ? realMsg : m));
                }
            });
        } catch (error) {
            console.error("Failed to send message", error);
            setMessages((prev) =>
                prev.filter((m) => !m.id.startsWith("temp-")),
            );
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <div className="flex items-center gap-3 p-4 bg-white border-b border-slate-200 shadow-sm z-10">
                <button
                    onClick={onBack}
                    className="md:hidden text-slate-500 hover:text-emerald-600 p-2"
                >
                    ←
                </button>
                <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                    {conversationDetail?.type === "GROUP" ? "👥" : "#"}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">
                        {conversationDetail?.name || "Conversation Details"}
                    </h3>
                    <p className="text-xs text-slate-400">
                        {conversationDetail?.type === "GROUP"
                            ? `${conversationDetail?.members?.length || 0} members`
                            : `ID: ${conversationId.split("-")[0]}...`}
                    </p>
                </div>

                {conversationDetail?.type === "GROUP" && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                        <span>+</span> Add Member
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full text-slate-400">
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-slate-400 gap-2">
                        <span className="text-3xl">👋</span>
                        <p>
                            Say hello! This is the beginning of your
                            conversation.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === profile?.id;
                        const isTemp = msg.id.startsWith("temp-");

                        return (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"} ${isTemp ? "opacity-50" : ""}`}
                            >
                                {!isMe && (
                                    <div className="size-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500 mt-auto overflow-hidden">
                                        {msg.senderAvatarUrl ? (
                                            <img
                                                src={msg.senderAvatarUrl}
                                                alt="avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            msg.senderName?.charAt(0) || "?"
                                        )}
                                    </div>
                                )}
                                <div
                                    className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}
                                >
                                    {!isMe && (
                                        <span className="text-[10px] text-slate-400 mb-1 ml-1">
                                            {msg.senderName}
                                        </span>
                                    )}

                                    <div
                                        className={`px-4 py-2 rounded-2xl ${
                                            isMe
                                                ? "bg-emerald-600 text-white rounded-br-sm"
                                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                                        }`}
                                    >
                                        {msg.content && (
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {msg.content}
                                            </p>
                                        )}

                                        {msg.media && msg.media.length > 0 && (
                                            <div
                                                className={`mt-2 grid gap-1 ${msg.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                                            >
                                                {msg.media.map((item) => (
                                                    <img
                                                        key={item.id}
                                                        src={item.fileUrl}
                                                        alt={
                                                            item.altText ||
                                                            "attachment"
                                                        }
                                                        className="rounded-md max-h-32 w-full object-cover"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 mx-1">
                                        {new Date(
                                            msg.createdAt,
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
                {imagePreviews.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {imagePreviews.map((preview, index) => (
                            <div
                                key={index}
                                className="relative w-16 h-16 flex-shrink-0"
                            >
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded-lg border border-slate-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePreview(index)}
                                    className="absolute -top-1 -right-1 bg-slate-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-rose-500 transition"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-end gap-2">
                    <label
                        className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                        title="Attach file"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            ></path>
                        </svg>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isSending}
                        />
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 max-h-32 min-h-[44px] p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                        rows={1}
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={
                            (!content.trim() && selectedFiles.length === 0) ||
                            isSending
                        }
                        className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <span className="flex size-5 items-center justify-center animate-spin">
                                ⏳
                            </span>
                        ) : (
                            <svg
                                className="w-5 h-5 rotate-90"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                ></path>
                            </svg>
                        )}
                    </button>
                </form>
            </div>

            {isAddModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm rounded-r-2xl">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                Add Recent Contacts
                            </h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-slate-400 hover:text-rose-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-2 bg-white border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                            {isLoadingSuggestions ? (
                                <div className="p-4 text-xs text-center text-slate-500 animate-pulse">
                                    Loading recent chats...
                                </div>
                            ) : suggestedUsers.length > 0 ? (
                                suggestedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="size-8 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700 overflow-hidden shrink-0">
                                                {user.avatarUrl ? (
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt=""
                                                        className="size-full object-cover"
                                                    />
                                                ) : (
                                                    user.fullName.charAt(0)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate">
                                                    {user.fullName}
                                                </p>
                                                <p className="text-[10px] text-slate-500 truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleAddMember(user.id)
                                            }
                                            disabled={isAddingUser === user.id}
                                            className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 transition shrink-0"
                                        >
                                            {isAddingUser === user.id
                                                ? "Adding..."
                                                : "Add"}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-xs text-center text-slate-500">
                                    No new recent contacts to add.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
