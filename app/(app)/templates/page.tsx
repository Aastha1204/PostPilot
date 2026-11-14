import { TemplateGallery } from "@/components/templates/gallery";
import { PageHeader } from "@/components/ui/page-header";

export default function TemplatesPage() {
  return (
    <>
      <PageHeader
        title="Templates"
        description="Seven template families, drawn live with the active brand kit. Switch business and every design re-themes."
      />
      <TemplateGallery />
    </>
  );
}
