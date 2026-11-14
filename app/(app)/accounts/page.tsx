import { AccountsView } from "@/components/publishing/accounts-view";
import { PageHeader } from "@/components/ui/page-header";

export default function AccountsPage() {
  return (
    <>
      <PageHeader title="Accounts" description="Instagram, Facebook Page and WhatsApp Business connections, plus your daily publishing quota." />
      <AccountsView />
    </>
  );
}
