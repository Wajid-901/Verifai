"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== "undefined") { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

interface CheckoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function CheckoutButton({ className, children }: CheckoutButtonProps) {
  const [busy,    setBusy]    = useState(false);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  const handleClick = async () => {
    setErrMsg(null);
    setBusy(true);
    try {
      await loadRazorpayScript();

      const res  = await fetch("/api/razorpay/create-subscription", { method: "POST" });
      const body = await res.json() as { subscriptionId?: string; keyId?: string; error?: string };

      if (res.status === 401) {
        window.location.href = "/sign-up";
        return;
      }
      if (body.error || !body.subscriptionId) {
        // Not signed in or other error — send to sign-up
        window.location.href = "/sign-up";
        return;
      }

      const rzp = new window.Razorpay({
        key:             body.keyId,
        subscription_id: body.subscriptionId,
        name:            "Verifai",
        description:     "Pro Plan — 25,000 emails/month",
        theme:           { color: "#4f46e5" },
        handler: async (response: {
          razorpay_payment_id:      string;
          razorpay_subscription_id: string;
          razorpay_signature:       string;
        }) => {
          setBusy(true);
          try {
            await fetch("/api/razorpay/verify", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify(response),
            });
          } finally {
            window.location.href = "/dashboard?billing=success";
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={busy} className={className}>
        {busy
          ? <><Loader2 className="inline h-4 w-4 animate-spin" /> Processing…</>
          : children}
      </button>
      {errMsg && (
        <p className="mt-2 text-center text-xs text-red-500">{errMsg}</p>
      )}
    </div>
  );
}
