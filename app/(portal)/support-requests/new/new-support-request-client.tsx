"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { SupportRequestForm } from "@/components/support-request-form";
import { Notice, PageHeading } from "@/components/support-ui";
import {
  createSupportRequest,
  type SupportRequestPayload,
} from "@/lib/api";

export default function NewSupportRequestClient() {
  const router = useRouter();
  const { profile, getAccessToken } = useAuth();

  if (profile.role !== "REQUESTER") {
    return (
      <Notice type="error">
        Only requester accounts can create support requests.
      </Notice>
    );
  }

  async function handleSubmit(payload: SupportRequestPayload) {
    const token = await getAccessToken();
    const created = await createSupportRequest(token, payload);
    router.push(`/support-requests/${created.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeading
        eyebrow="Step 1"
        title="Create a support request"
        description="Start with the request overview. After creating it, you can add specific needs such as money, food, or supplies."
      />
      <SupportRequestForm
        submitLabel="Create request"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/support-requests")}
      />
    </div>
  );
}
