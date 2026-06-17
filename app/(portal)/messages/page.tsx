import { MessagesClient } from "./messages-client";

export default async function MessagesPage({
    searchParams,
}: {
    searchParams: Promise<{ conversationId?: string | string[] }>;
}) {
    const params = await searchParams;
    const conversationId = Array.isArray(params.conversationId)
        ? params.conversationId[0]
        : params.conversationId;

    return (
        <div className="max-w-7xl mx-auto w-full">
            <MessagesClient initialConversationId={conversationId ?? null} />
        </div>
    );
}
