import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db";

test("Customer cart and favorites database tables work as expected", async () => {
  const testUserId = "test-user-sync-" + Date.now();

  // Find a real product
  const product = await db.product.findFirst({ where: { isActive: true } });
  assert.ok(product, "Active product should exist");

  // 1. Test adding a favorite
  const fav = await db.customerFavorite.create({
    data: {
      userId: testUserId,
      productId: product.id,
    },
  });
  assert.equal(fav.userId, testUserId);
  assert.equal(fav.productId, product.id);

  // 2. Test fetching user favorites
  const userFavs = await db.customerFavorite.findMany({ where: { userId: testUserId } });
  assert.equal(userFavs.length, 1);
  assert.equal(userFavs[0].productId, product.id);

  // 3. Test saving a cart item
  const cartItem = await db.customerCartItem.create({
    data: {
      userId: testUserId,
      itemId: product.id,
      productId: product.id,
      quantity: 2,
    },
  });
  assert.equal(cartItem.quantity, 2);

  // 4. Test updating quantity
  const updatedCartItem = await db.customerCartItem.update({
    where: { id: cartItem.id },
    data: { quantity: 5 },
  });
  assert.equal(updatedCartItem.quantity, 5);

  // Cleanup test data
  await db.customerFavorite.deleteMany({ where: { userId: testUserId } });
  await db.customerCartItem.deleteMany({ where: { userId: testUserId } });

  const remainingFavs = await db.customerFavorite.findMany({ where: { userId: testUserId } });
  assert.equal(remainingFavs.length, 0);
});
