/**
 * Seed Razorpay Plan for Verifai Pro
 * Run: pnpm --filter @workspace/scripts run seed-razorpay
 *
 * After running, copy the plan_id from the output and
 * set it as RAZORPAY_PLAN_ID in your Replit secrets.
 */

import Razorpay from "razorpay";

const keyId     = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.error("❌  Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.");
  console.error("    Set them in your Replit secrets before running this script.");
  process.exit(1);
}

const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

async function main() {
  console.log("🔍  Checking for existing Verifai Pro plan…\n");

  // List existing plans to avoid duplicates
  const { items: existingPlans } = await razorpay.plans.all({ count: 100 }) as {
    items: Array<{ id: string; item?: { name?: string; amount?: number }; interval?: number; period?: string }>;
  };

  const existing = existingPlans.find((p) => p.item?.name === "Verifai Pro");

  if (existing) {
    console.log("✅  Verifai Pro plan already exists:");
    console.log(`    Plan ID : ${existing.id}`);
    console.log(`    Amount  : ₹${((existing.item?.amount ?? 0) / 100).toFixed(2)} / ${existing.period}`);
    console.log("\n📌  Set this in your Replit secrets:");
    console.log(`    RAZORPAY_PLAN_ID=${existing.id}`);
    return;
  }

  console.log("🚀  Creating Verifai Pro plan…");

  const plan = await razorpay.plans.create({
    period:   "monthly",
    interval: 1,
    item: {
      name:        "Verifai Pro",
      amount:      150000, // ₹1,500.00 in paise (~$18 USD)
      unit_amount: 150000,
      currency:    "INR",
    },
    notes: {
      product: "verifai",
      tier:    "pro",
    },
  } as Parameters<typeof razorpay.plans.create>[0]);

  console.log("\n✅  Plan created successfully!");
  console.log(`    Plan ID  : ${plan.id}`);
  console.log(`    Amount   : ₹1,500.00 / month`);
  console.log(`    Currency : INR`);
  console.log("\n📌  IMPORTANT — set this in your Replit secrets:");
  console.log(`\n    RAZORPAY_PLAN_ID=${plan.id}\n`);
  console.log("Then restart the web server for the change to take effect.");
}

main().catch((err) => {
  console.error("❌  Error:", err?.error?.description ?? err.message ?? err);
  process.exit(1);
});
