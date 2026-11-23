import { Suspense } from "react";
import { ProblemBrowser } from "@/components/ProblemBrowser";

export default function Home() {
  return (
    <div className="page">
      <Suspense>
        <ProblemBrowser />
      </Suspense>
    </div>
  );
}
