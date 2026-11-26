import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCoupon, getPublicCoupons } from '../src/lib/actions';

test('coupons system: lists public coupons and validates eligibility correctly', async () => {
  const coupons = await getPublicCoupons();
  assert.ok(coupons.length >= 4, `Expected at least 4 coupons, got ${coupons.length}`);

  const welcome = coupons.find(c => c.code === 'WELCOME10');
  assert.ok(welcome, 'WELCOME10 must be in public coupons');
  assert.equal(welcome.type, 'percentage');
  assert.equal(welcome.value, 10);
  assert.equal(welcome.minOrder, 500);

  // Test below min order
  const invalidRes = await validateCoupon('WELCOME10', 300);
  assert.equal(invalidRes.valid, false);
  assert.match(invalidRes.error || '', /Minimum order value/);

  // Test above min order
  const validRes = await validateCoupon('WELCOME10', 600);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.coupon?.code, 'WELCOME10');

  // Test flat coupon
  const flatRes = await validateCoupon('GOODWILL50', 550);
  assert.equal(flatRes.valid, true);
  assert.equal(flatRes.coupon?.code, 'GOODWILL50');

  // Test invalid coupon
  const nonExistent = await validateCoupon('NOTREALCODE99', 1000);
  assert.equal(nonExistent.valid, false);
});
