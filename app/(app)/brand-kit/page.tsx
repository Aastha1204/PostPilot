import { BrandKitForm } from "@/components/brand/brand-kit-form";
import { PageHeader } from "@/components/ui/page-header";

export default function BrandKitPage() {
  return (
    <>
      <PageHeader title="Brand Kit" description="Six short steps. Everything autosaves and the preview on the right redraws as you type." />
      <BrandKitForm />
    </>
  );
}
