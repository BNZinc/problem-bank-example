import type { Metadata } from "next";
import { WorksheetList } from "@/components/WorksheetList";

export const metadata: Metadata = { title: "문제지" };

export default function Worksheets() {
  return <WorksheetList />;
}
