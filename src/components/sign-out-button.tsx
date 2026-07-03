"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ onDark = false }: { onDark?: boolean }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant={onDark ? "onDark" : "ghost"}
      onClick={handleSignOut}
      className="!h-9 !px-3.5 !text-xs sm:!text-sm"
    >
      Sign out
    </Button>
  );
}
