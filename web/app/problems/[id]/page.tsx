import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProblemEditor } from "@/components/ProblemEditor";

export const metadata: Metadata = { title: "문제 고치기" };

export default async function EditProblem({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <ProblemEditor id={id} />;
}
