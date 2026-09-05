import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOnboarding() {
  const user = await requireAuth();
  if (!user.onboardingComplete) redirect("/onboarding");
  return user;
}

export async function redirectIfAuthenticated() {
  const user = await getCurrentUser();
  if (user) {
    if (!user.onboardingComplete) redirect("/onboarding");
    redirect("/dashboard");
  }
}
