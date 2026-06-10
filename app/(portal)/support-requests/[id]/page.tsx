import SupportRequestDetailClient from "./support-request-detail-client";

export default async function SupportRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SupportRequestDetailClient supportRequestId={id} />;
}
