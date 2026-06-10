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
        Chỉ tài khoản người cần hỗ trợ mới có thể đăng yêu cầu.
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
        eyebrow="Bước 1"
        title="Đăng yêu cầu hỗ trợ"
        description="Cung cấp thông tin tổng quan trước. Sau khi tạo, bạn có thể thêm từng nhu cầu cụ thể như tiền, thực phẩm hoặc vật dụng."
      />
      <SupportRequestForm
        submitLabel="Tạo yêu cầu"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/support-requests")}
      />
    </div>
  );
}
