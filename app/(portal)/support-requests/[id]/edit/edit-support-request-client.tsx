"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import {
  SupportRequestForm,
  type SupportRequestFormValue,
} from "@/components/support-request-form";
import {
  LoadingBlock,
  Notice,
  PageHeading,
} from "@/components/support-ui";
import {
  getSupportRequest,
  updateSupportRequest,
  type SupportRequestPayload,
} from "@/lib/api";

export default function EditSupportRequestClient({
  supportRequestId,
}: {
  supportRequestId: string;
}) {
  const router = useRouter();
  const { profile, getAccessToken } = useAuth();
  const [initialValue, setInitialValue] =
    useState<SupportRequestFormValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const request = await getSupportRequest(token, supportRequestId);

      if (request.requesterId !== profile.id) {
        setError("You can only edit requests that you created.");
        return;
      }

      if (request.status !== "PENDING") {
        setError("Only requests pending review can be edited.");
        return;
      }

      setInitialValue({
        title: request.title,
        description: request.description,
        categoryId: request.categoryId,
        address: request.address ?? "",
        latitude: request.latitude?.toString() ?? "",
        longitude: request.longitude?.toString() ?? "",
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }, [getAccessToken, profile.id, supportRequestId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRequest();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRequest]);

  if (profile.role !== "REQUESTER") {
    return <Notice type="error">You do not have permission to edit this request.</Notice>;
  }

  if (error) {
    return <Notice type="error">{error}</Notice>;
  }

  if (!initialValue) {
    return <LoadingBlock message="Loading request details..." />;
  }

  async function handleSubmit(payload: SupportRequestPayload) {
    const token = await getAccessToken();
    await updateSupportRequest(token, supportRequestId, payload);
    router.push(`/support-requests/${supportRequestId}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeading
        eyebrow="Update details"
        title="Edit support request"
        description="Changes are allowed while the request is still pending review."
      />
      <SupportRequestForm
        initialValue={initialValue}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() =>
          router.push(`/support-requests/${supportRequestId}`)
        }
      />
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to load request details.";
}
