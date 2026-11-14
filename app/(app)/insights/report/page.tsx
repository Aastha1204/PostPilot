import { Suspense } from "react";
import { ReportView } from "@/components/insights/report-view";

export default function ReportPage() {
  return (
    <Suspense>
      <ReportView />
    </Suspense>
  );
}
