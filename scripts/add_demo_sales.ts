import { db } from "../src/lib/db";

async function addDemoSales() {
  console.log("Adding demo sales and orders...");

  // Fetch or create sample customers
  let sajeev = await db.customer.findFirst({ where: { phone: "9876543210" } });
  let ratheesh = await db.customer.findFirst({ where: { phone: "9447123456" } });
  
  let faisal = await db.customer.findFirst({ where: { phone: "9847112233" } });
  if (!faisal) {
    faisal = await db.customer.create({
      data: {
        name: "Faisal V.P. (Pattambi)",
        phone: "9847112233",
        email: "faisal.vp@gmail.com",
        tier: "contractor",
      },
    });
  }

  let anoop = await db.customer.findFirst({ where: { phone: "9745566778" } });
  if (!anoop) {
    anoop = await db.customer.create({
      data: {
        name: "Anoop Kumar (Cherpulassery)",
        phone: "9745566778",
        email: "anoop.k@gmail.com",
        tier: "retail",
      },
    });
  }

  const products = await db.product.findMany({ take: 10 });
  if (products.length === 0) {
    console.error("No products found in database.");
    return;
  }

  const findProd = (keyword: string) =>
    products.find((p) => p.name.toLowerCase().includes(keyword.toLowerCase())) || products[0];

  const wire = findProd("wire") || products[0];
  const switchProd = findProd("switch") || products[1] || products[0];
  const pipe = findProd("pipe") || products[2] || products[0];
  const mixer = findProd("mixer") || products[3] || products[0];
  const bulb = findProd("bulb") || products[4] || products[0];

  // Helper for generating order numbers
  const count = await db.order.count();
  let orderSeq = count + 1;

  const now = new Date(); // Oct 26, 2026

  interface DemoOrderSpec {
    daysAgo: number;
    hoursAgo?: number;
    customer: typeof faisal;
    status: string;
    items: Array<{ product: typeof wire; qty: number; price: number }>;
    paymentMethod: string;
    paymentStatus: string;
    deliveryType: string;
  }

  const demoOrders: DemoOrderSpec[] = [
    // Today
    {
      daysAgo: 0,
      hoursAgo: 1,
      customer: faisal,
      status: "CONFIRMED",
      items: [
        { product: wire, qty: 4, price: wire.price },
        { product: switchProd, qty: 20, price: switchProd.price },
      ],
      paymentMethod: "cod",
      paymentStatus: "pending",
      deliveryType: "delivery",
    },
    {
      daysAgo: 0,
      hoursAgo: 3,
      customer: anoop,
      status: "PACKED",
      items: [
        { product: mixer, qty: 1, price: mixer.price },
        { product: pipe, qty: 4, price: pipe.price },
      ],
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      deliveryType: "delivery",
    },
    {
      daysAgo: 0,
      hoursAgo: 5,
      customer: sajeev || faisal,
      status: "DELIVERED",
      items: [
        { product: bulb, qty: 10, price: bulb.price },
        { product: switchProd, qty: 10, price: switchProd.price },
      ],
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      deliveryType: "pickup",
    },

    // Yesterday (Day -1)
    {
      daysAgo: 1,
      customer: ratheesh || anoop,
      status: "DELIVERED",
      items: [
        { product: wire, qty: 3, price: wire.price },
        { product: pipe, qty: 6, price: pipe.price },
      ],
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      deliveryType: "delivery",
    },
    {
      daysAgo: 1,
      customer: anoop,
      status: "DELIVERED",
      items: [{ product: mixer, qty: 1, price: mixer.price }],
      paymentMethod: "cod",
      paymentStatus: "paid",
      deliveryType: "pickup",
    },

    // 2 Days ago (Day -2)
    {
      daysAgo: 2,
      customer: faisal,
      status: "DELIVERED",
      items: [
        { product: wire, qty: 5, price: wire.price },
        { product: bulb, qty: 15, price: bulb.price },
      ],
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      deliveryType: "delivery",
    },
    {
      daysAgo: 2,
      customer: sajeev || faisal,
      status: "DELIVERED",
      items: [{ product: switchProd, qty: 30, price: switchProd.price }],
      paymentMethod: "cod",
      paymentStatus: "paid",
      deliveryType: "delivery",
    },

    // 3 Days ago (Day -3)
    {
      daysAgo: 3,
      customer: ratheesh || anoop,
      status: "DELIVERED",
      items: [
        { product: pipe, qty: 12, price: pipe.price },
        { product: wire, qty: 2, price: wire.price },
      ],
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      deliveryType: "delivery",
    },

    // 4 Days ago (Day -4)
    {
      daysAgo: 4,
      customer: anoop,
      status: "DELIVERED",
      items: [
        { product: mixer, qty: 2, price: mixer.price },
        { product: wire, qty: 4, price: wire.price },
      ],
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      deliveryType: "delivery",
    },

    // 5 Days ago (Day -5)
    {
      daysAgo: 5,
      customer: faisal,
      status: "DELIVERED",
      items: [
        { product: wire, qty: 3, price: wire.price },
        { product: switchProd, qty: 25, price: switchProd.price },
        { product: bulb, qty: 10, price: bulb.price },
      ],
      paymentMethod: "cod",
      paymentStatus: "paid",
      deliveryType: "delivery",
    },

    // 6 Days ago (Day -6)
    {
      daysAgo: 6,
      customer: sajeev || anoop,
      status: "DELIVERED",
      items: [
        { product: pipe, qty: 8, price: pipe.price },
        { product: mixer, qty: 1, price: mixer.price },
      ],
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      deliveryType: "delivery",
    },
  ];

  for (const spec of demoOrders) {
    const orderDate = new Date(now);
    orderDate.setDate(now.getDate() - spec.daysAgo);
    if (spec.hoursAgo) {
      orderDate.setHours(now.getHours() - spec.hoursAgo);
    } else {
      orderDate.setHours(11 + (spec.daysAgo % 5), 30, 0);
    }

    const subtotal = spec.items.reduce((s, it) => s + it.qty * it.price, 0);
    const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const deliveryCharge = spec.deliveryType === "delivery" ? 80 : 0;
    const total = subtotal + gstAmount + deliveryCharge;

    const orderNumStr = String(orderSeq++).padStart(4, "0");
    const orderNumber = `GW-2026-${orderNumStr}`;

    const shippingAddress = JSON.stringify({
      name: spec.customer?.name || "Customer",
      phone: spec.customer?.phone || "9876543210",
      line1: "Near Goodwill Electricals, Kulappully",
      city: "Shoranur",
      district: "Palakkad",
      pincode: "679122",
    });

    const order = await db.order.create({
      data: {
        orderNumber,
        customerId: spec.customer!.id,
        subtotal,
        gstAmount,
        deliveryCharge,
        discount: 0,
        total,
        deliveryType: spec.deliveryType,
        shippingAddress,
        status: spec.status,
        paymentMethod: spec.paymentMethod,
        paymentStatus: spec.paymentStatus,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: spec.items.map((it) => ({
            productId: it.product.id,
            productName: it.product.name,
            price: it.price,
            quantity: it.qty,
            total: it.qty * it.price,
          })),
        },
        events: {
          create: [
            {
              status: "PLACED",
              note: "Order placed online",
              actor: "customer",
              createdAt: orderDate,
            },
            ...(spec.status !== "PLACED"
              ? [
                  {
                    status: spec.status,
                    note: `Status updated to ${spec.status}`,
                    actor: "Yahya Peersha",
                    createdAt: orderDate,
                  },
                ]
              : []),
          ],
        },
      },
    });

    console.log(`Created ${order.orderNumber}: ₹${order.total.toLocaleString("en-IN")} on ${orderDate.toISOString().split("T")[0]}`);
  }

  console.log("Demo sales added successfully!");
}

addDemoSales()
  .catch(console.error)
  .finally(() => process.exit(0));
