import { QueueView } from "@/components/publishing/queue-view";
import { PageHeader } from "@/components/ui/page-header";

export default function QueuePage() {
  return (
    <>
      <PageHeader title="Queue" description="Publish jobs, retries with backoff, and a live log of every step." />
      <QueueView />
    </>
  );
}
