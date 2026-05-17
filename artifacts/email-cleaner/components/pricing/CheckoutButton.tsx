"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function CheckoutButton({ className, children }: CheckoutButtonProps) {
  const router  = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const res  = await fetch("/api/stripe/checkout", { method: "POST" });
      const body = await res.json() as { url?: string; error?: string };

      if (res.status === 401) {
        router.push("/sign-up");
        return;
      }
      if (body.url) {
        window.location.href = body.url;
        return;
      }
      // Any other error — send to sign-up as safe fallback
      router.push("/sign-up");
    } catch {
      router.push("/sign-up");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={busy} className={className}>
      {busy
        ? <><Loader2 className="inline h-4 w-4 animate-spin" /> Processing…</>
        : children ?? <>Get started <ArrowRight className="inline h-4 w-4" /></>}
    </button>
  );
}
