import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorksheetEditor } from "@/components/WorksheetEditor";

export const metadata: Metadata = { title: "문제지 고치기" };

export default async function WorksheetPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <WorksheetEditor id={id} />;
}
