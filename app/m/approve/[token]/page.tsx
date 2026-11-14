import { MobileApprove } from "@/components/approvals/mobile-approve";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <MobileApprove token={token} />;
}
