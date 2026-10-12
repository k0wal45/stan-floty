import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/modules/auth/SignupForm";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/logowanie");
  }

  if (user.role !== "ADMIN") {
    redirect("/panel");
  }

  return <SignupForm />;
}

