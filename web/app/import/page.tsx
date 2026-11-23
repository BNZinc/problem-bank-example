import type { Metadata } from "next";
import { ImportPanel } from "@/components/ImportPanel";

export const metadata: Metadata = { title: "가져오기" };

export default function ImportPage() {
  return <ImportPanel />;
}
