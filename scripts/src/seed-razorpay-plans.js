/**
 * Seed Razorpay Plan for Verifai Pro
 * Run: pnpm --filter @workspace/scripts run seed-razorpay
 *
 * After running, copy the plan_id from the output and
 * set it as RAZORPAY_PLAN_ID in your Replit secrets.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import Razorpay from "razorpay";
var keyId = process.env.RAZORPAY_KEY_ID;
var keySecret = process.env.RAZORPAY_KEY_SECRET;
if (!keyId || !keySecret) {
    console.error("❌  Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.");
    console.error("    Set them in your Replit secrets before running this script.");
    process.exit(1);
}
var razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var existingPlans, existing, plan;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("🔍  Checking for existing Verifai Pro plan…\n");
                    return [4 /*yield*/, razorpay.plans.all({ count: 100 })];
                case 1:
                    existingPlans = (_c.sent()).items;
                    existing = existingPlans.find(function (p) { var _a; return ((_a = p.item) === null || _a === void 0 ? void 0 : _a.name) === "Verifai Pro"; });
                    if (existing) {
                        console.log("✅  Verifai Pro plan already exists:");
                        console.log("    Plan ID : ".concat(existing.id));
                        console.log("    Amount  : \u20B9".concat((((_b = (_a = existing.item) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0) / 100).toFixed(2), " / ").concat(existing.period));
                        console.log("\n📌  Set this in your Replit secrets:");
                        console.log("    RAZORPAY_PLAN_ID=".concat(existing.id));
                        return [2 /*return*/];
                    }
                    console.log("🚀  Creating Verifai Pro plan…");
                    return [4 /*yield*/, razorpay.plans.create({
                            period: "monthly",
                            interval: 1,
                            item: {
                                name: "Verifai Pro",
                                amount: 150000, // ₹1,500.00 in paise (~$18 USD)
                                unit_amount: 150000,
                                currency: "INR",
                            },
                            notes: {
                                product: "verifai",
                                tier: "pro",
                            },
                        })];
                case 2:
                    plan = _c.sent();
                    console.log("\n✅  Plan created successfully!");
                    console.log("    Plan ID  : ".concat(plan.id));
                    console.log("    Amount   : \u20B91,500.00 / month");
                    console.log("    Currency : INR");
                    console.log("\n📌  IMPORTANT — set this in your Replit secrets:");
                    console.log("\n    RAZORPAY_PLAN_ID=".concat(plan.id, "\n"));
                    console.log("Then restart the web server for the change to take effect.");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    var _a, _b, _c;
    console.error("❌  Error:", (_c = (_b = (_a = err === null || err === void 0 ? void 0 : err.error) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : err.message) !== null && _c !== void 0 ? _c : err);
    process.exit(1);
});
