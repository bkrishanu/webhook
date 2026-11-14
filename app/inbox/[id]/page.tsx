import { notFound } from "next/navigation";
import { Inbox } from "@/components/Inbox";
import { isValidHookId } from "@/lib/types";

export default async function InboxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidHookId(id)) notFound();
  return <Inbox hookId={id} />;
}
