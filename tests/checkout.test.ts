import assert from "node:assert/strict";
import test from "node:test";
import { deliveryEstimate } from "../src/lib/delivery";
import { computeTotals } from "../src/lib/pricing";
import { createOrder } from "../src/lib/actions";

test("delivery availability handles local, boundary and outside-area pincodes", () => {
  assert.ok(deliveryEstimate("679122"));
  assert.ok(deliveryEstimate("679101"));
  assert.ok(deliveryEstimate("679599"));
  for (const pin of ["679100", "679600", "682001", "67912", "abcdef"]) assert.equal(deliveryEstimate(pin), null);
});

test("server rejects unsupported delivery before creating an order", async () => {
  const result = await createOrder({ name: "QA", phone: "9999999999", email: "", line1: "QA", city: "QA", pincode: "682001", deliveryType: "delivery", paymentMethod: "cod", items: [{ productId: "qa-never-inserted", quantity: 1 }] });
  assert.equal(result.success, false);
  assert.match(result.error ?? "", /Outside our regular delivery area/);
});

test("delivery threshold, pickup and GST-inclusive totals stay consistent", () => {
  assert.equal(computeTotals({ lines: [{ price: 449, quantity: 1 }] }).total, 529);
  assert.equal(computeTotals({ lines: [{ price: 999, quantity: 1 }] }).deliveryCharge, 80);
  assert.equal(computeTotals({ lines: [{ price: 1000, quantity: 1 }] }).deliveryCharge, 0);
  assert.equal(computeTotals({ lines: [{ price: 449, quantity: 1 }], deliveryType: "pickup" }).total, 449);
  const discounted = computeTotals({ lines: [{ price: 118, quantity: 2, gstRate: 18 }], coupon: { type: "percentage", value: 50 }, deliveryType: "pickup" });
  assert.equal(discounted.total, 118);
  assert.equal(discounted.gstAmount, 18);
});
