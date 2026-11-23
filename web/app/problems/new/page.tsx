import type { Metadata } from "next";
import { ProblemEditor } from "@/components/ProblemEditor";

export const metadata: Metadata = { title: "새 문제" };

export default function NewProblem() {
  return <ProblemEditor />;
}
