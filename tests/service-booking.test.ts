import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db";
import { createServiceRequest } from "../src/lib/actions";

test("Customer booking / service request flows into database and CRM", async () => {
  const testPhone = "9847" + Math.floor(100000 + Math.random() * 900000);
  const testName = "Test Booking Customer";
  const testLocation = "Kulappully West, Shoranur";

  // 1. Submit service booking
  const result = await createServiceRequest({
    serviceType: "Plumbing & Sanitary Fitting",
    name: testName,
    phone: testPhone,
    email: "booking.customer@example.com",
    location: testLocation,
    preferredDate: "2026-11-20",
    details: "Fitting for new wash basin and commode",
  });

  assert.equal(result.success, true);
  assert.ok(result.request);
  assert.equal(result.request.status, "new");
  assert.equal(result.request.phone, testPhone);

  // 2. Verify record exists in ServiceRequest table
  const dbReq = await db.serviceRequest.findUnique({
    where: { id: result.request.id },
  });
  assert.ok(dbReq);
  assert.equal(dbReq.serviceType, "Plumbing & Sanitary Fitting");
  assert.equal(dbReq.location, testLocation);

  // 3. Verify customer is automatically synced to Customer CRM table
  const crmCustomer = await db.customer.findUnique({
    where: { phone: testPhone },
  });
  assert.ok(crmCustomer);
  assert.equal(crmCustomer.name, testName);

  // 4. Test stage update to 'scheduled' and technician assignment
  const updatedReq = await db.serviceRequest.update({
    where: { id: result.request.id },
    data: {
      status: "scheduled",
      assignedTo: "Rajesh (Senior Plumber)",
    },
  });
  assert.equal(updatedReq.status, "scheduled");
  assert.equal(updatedReq.assignedTo, "Rajesh (Senior Plumber)");

  // Cleanup test data
  await db.serviceRequest.delete({ where: { id: result.request.id } });
  await db.customer.delete({ where: { id: crmCustomer.id } });
});
