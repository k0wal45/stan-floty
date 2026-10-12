import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold">Stan Floty</span>
            </Link>
            <nav className="flex gap-6">
              <Link href="/cennik" className="text-sm font-medium transition-colors hover:text-primary">
                Cennik
              </Link>
              <Link href="/info" className="text-sm font-medium transition-colors hover:text-primary">
                Info
              </Link>
              <Link href="/dokumentacja" className="text-sm font-medium transition-colors hover:text-primary">
                Dokumentacja
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/logowanie">
              <Button size="sm">Zaloguj się</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
