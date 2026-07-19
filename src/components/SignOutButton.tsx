"use client";

import { useRouter } from "next/navigation";
import { createBrowserAuthClient } from "@/infra/db/browser-auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const sb = createBrowserAuthClient();
    await sb.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-sm text-gray-500 hover:underline"
    >
      로그아웃
    </button>
  );
}
