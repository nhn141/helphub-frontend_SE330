import { SocialClient } from "./social-client";

export default function SocialPage() {
    return (
        <div className="max-w-2xl mx-auto py-6 px-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">
                Community Feed
            </h1>
            <SocialClient />
        </div>
    );
}
