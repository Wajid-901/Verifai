import Razorpay from "razorpay";
import crypto from "crypto";

/** Returns an authenticated Razorpay API client. */
export function getRazorpayClient(): Razorpay {
  const keyId     = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing Razorpay credentials. " +
      "Set RAZORPAY_KEY_ID or NEXT_PUBLIC_RAZORPAY_KEY_ID, and RAZORPAY_KEY_SECRET."
    );
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/**
 * Verifies an incoming Razorpay webhook signature.
 * Uses timing-safe comparison to prevent timing attacks.
 * Signature = HMAC-SHA256(raw_body, RAZORPAY_WEBHOOK_SECRET)
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

/**
 * Verifies the payment signature from Razorpay Checkout for subscriptions.
 * Signature = HMAC-SHA256(payment_id + "|" + subscription_id, RAZORPAY_KEY_SECRET)
 */
export function verifyPaymentSignature(
  razorpayPaymentId: string,
  razorpaySubscriptionId: string,
  razorpaySignature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Missing RAZORPAY_KEY_SECRET");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(razorpaySignature, "hex"),
    );
  } catch {
    return false;
  }
}
