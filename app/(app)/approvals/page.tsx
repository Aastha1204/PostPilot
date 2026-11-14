import { ApprovalsStage } from "@/components/approvals/approvals-stage";
import { getRuntimeConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function ApprovalsPage() {
  return <ApprovalsStage approvalSync={getRuntimeConfig().approvalSync} />;
}
