/**
 * Stripe integration architecture — types and interfaces.
 *
 * Stripe is NOT yet connected. Wire up by:
 *  1. Adding STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET as secrets
 *  2. Following the `stripe` skill to create stripeClient.ts, webhook handlers, and billing routes
 *  3. Updating the `subscriptions` table via supabase/schema.sql on plan change
 */

export type StripeSubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid";

export interface StripeSubscription {
  id: string;
  customerId: string;
  subscriptionId: string;
  status: StripeSubscriptionStatus;
  plan: "free" | "pro";
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface StripeCheckoutParams {
  userId: string;
  email: string;
  plan: "pro";
  successUrl: string;
  cancelUrl: string;
}

export interface StripePriceConfig {
  priceId: string;
  productId: string;
  interval: "month" | "year";
  amount: number;
  currency: string;
}

/** Price IDs — fill in after creating products in Stripe Dashboard */
export const STRIPE_PRICES: Record<"pro_monthly" | "pro_yearly", StripePriceConfig> = {
  pro_monthly: {
    priceId:   process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
    productId: process.env.STRIPE_PRODUCT_PRO ?? "",
    interval:  "month",
    amount:    1900, // $19.00
    currency:  "usd",
  },
  pro_yearly: {
    priceId:   process.env.STRIPE_PRICE_PRO_YEARLY ?? "",
    productId: process.env.STRIPE_PRODUCT_PRO ?? "",
    interval:  "year",
    amount:    15900, // $159.00
    currency:  "usd",
  },
};

/** Usage tracking shape — for metered billing or analytics */
export interface UsageRecord {
  userId: string;
  event: "validate" | "upload" | "download";
  emailCount: number;
  plan: "free" | "pro";
  timestamp: Date;
}
