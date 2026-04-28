import Link from "next/link";
import { QrCode } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 lg:px-10 border-b border-border/40">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <QrCode className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">QR Menu</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
