"use client";

import { signup } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await signup(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Wypożyczalnia i konto właściciela zostały pomyślnie utworzone");
      router.push("/admin");
    }
  }, [state, router]);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
          Strefa Administratora
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Zarejestruj nową wypożyczalnię
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Utwórz nową organizację (tenant) oraz konto jej właściciela
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="companyName" className="text-sm font-medium">
            Nazwa wypożyczalni / firmy
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Wypożyczalnia Sprzętu XYZ"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="fullName" className="text-sm font-medium">
            Imię i nazwisko właściciela
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Jan Kowalski"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Adres e-mail właściciela
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="wlasciciel@wypozyczalnia.pl"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            Tymczasowe hasło dostępu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Min. 8 znaków"
          />
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Tworzenie wypożyczalni..." : "Utwórz wypożyczalnię"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Powrót do{" "}
        <Link href="/admin" className="font-medium text-primary underline-offset-4 hover:underline">
          Panelu Administratora
        </Link>
      </p>
    </div>
  );
}
