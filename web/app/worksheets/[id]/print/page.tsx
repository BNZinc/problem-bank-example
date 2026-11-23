import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorksheetPrint } from "@/components/WorksheetPrint";

export const metadata: Metadata = { title: "인쇄" };

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <WorksheetPrint id={id} />;
}
