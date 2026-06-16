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
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAccessToken();
            const res = await getConversationMessages(token, conversationId);
            setMessages(res);
            handleMarkAsRead(res);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, getAccessToken]);

    useEffect(() => {
        fetchHistory();

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
    }, [conversationId, fetchHistory, getAccessToken]);

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

                if (!cloudName || !uploadPreset) {
                    throw new Error(
                        "Missing Cloudinary configuration in .env.local",
                    );
                }

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
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex items-center gap-3 p-4 bg-white border-b border-slate-200 shadow-sm z-10">
                <button
                    onClick={onBack}
                    className="md:hidden text-slate-500 hover:text-emerald-600 p-2"
                >
                    ←
                </button>
                <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                    #
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">
                        Conversation Details
                    </h3>
                    <p className="text-xs text-slate-400">
                        ID: {conversationId.split("-")[0]}...
                    </p>
                </div>
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

                                        {/* Render Media */}
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
                {/* Khu vực Preview Ảnh */}
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
        </div>
    );
}
