import { LanguageWrapper } from "@/components/public/language-wrapper";

export default function PublicMenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <LanguageWrapper>{children}</LanguageWrapper>
    </div>
  );
}
