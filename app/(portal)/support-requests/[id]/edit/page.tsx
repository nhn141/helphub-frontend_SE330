import EditSupportRequestClient from "./edit-support-request-client";

export default async function EditSupportRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditSupportRequestClient supportRequestId={id} />;
}
