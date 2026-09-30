import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center py-20">
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
        Zarządzaj swoją flotą <br className="hidden sm:inline" />
        <span className="text-primary">w prosty sposób</span>
      </h1>
      <p className="text-xl text-muted-foreground max-w-[600px] mx-auto mb-8">
        Zastąp arkusze Excel nowoczesnym systemem. Dynamiczna dostępność zasobów, szybkie wypożyczenia i jasne rozliczenia.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/rejestracja">
          <Button size="lg">Rozpocznij za darmo</Button>
        </Link>
        <Link href="/info">
          <Button variant="outline" size="lg">Dowiedz się więcej</Button>
        </Link>
      </div>
    </div>
  );
}

