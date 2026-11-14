import { CommandPalette } from "@/components/shell/command-palette";
import { PublishTicker } from "@/components/publishing/publish-ticker";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { getRuntimeConfig } from "@/lib/config";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { liveAvailable, missing } = getRuntimeConfig();
  return (
    <Providers>
      <PublishTicker />
      <CommandPalette />
      <div className="relative z-10 flex min-h-dvh flex-col md:flex-row">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
          <Topbar liveAvailable={liveAvailable} missing={missing} />
          <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
