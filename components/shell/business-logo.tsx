import { initials } from "@/lib/utils/format";
import { readableOn } from "@/lib/utils/color";
import { cn } from "@/lib/utils/cn";
import type { Business, BrandKit } from "@/lib/types";

interface Props {
  business: Business;
  kit: BrandKit;
  className?: string;
}

/** Monogram stand-in until a real logo is uploaded in the brand kit. */
export function BusinessLogo({ business, kit, className }: Props) {
  const { primary, secondary } = kit.colours;
  return (
    <span
      aria-hidden
      className={cn("inline-grid size-9 shrink-0 place-items-center rounded-xl text-[13px] font-semibold", className)}
      style={{
        background: `linear-gradient(135deg, ${primary}, color-mix(in srgb, ${primary} 60%, ${secondary}))`,
        color: readableOn(primary),
        boxShadow: `inset 0 0 0 1px ${secondary}`,
      }}
    >
      {initials(business.shortName)}
    </span>
  );
}
