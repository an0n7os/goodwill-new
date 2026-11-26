"use client";

import { useHydrated } from "@/lib/useHydrated";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { useCartStore } from "@/store/cart";
import { useCustomerAuthStore } from "@/store/customerAuth";
import {getPaymentConfig,startOnlinePayment} from "@/lib/paymentActions";
import {openGateway} from "@/lib/checkoutGateway";
import { createOrder } from "@/lib/actions";
import {getDeliveryRules,getCheckoutItems} from "@/lib/businessActions";
import {deliveryQuote,type DeliveryRule} from "@/lib/deliveryRules";
import { computeTotals, formatINR } from "@/lib/pricing";
import CustomerAuthModal from "@/components/auth/CustomerAuthModal";
import AvailableCoupons from "@/components/storefront/AvailableCoupons";
import { CreditCard, Truck, User, Phone, MapPin, Building, ShieldCheck, ShoppingBag, AlertCircle } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, coupon, setCoupon, clearCart, refreshItems } = useCartStore();

  const mounted = useHydrated();
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Form Fields
  const [nameInput, setName] = useState<string | null>(null);
  const [phoneInput, setPhone] = useState<string | null>(null);
  const [emailInput, setEmail] = useState<string | null>(null);
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryType, setDeliveryType] = useState("delivery"); // delivery | pickup
  const [paymentMethod,setPaymentMethod]=useState("cod");
  const [onlineEnabled,setOnlineEnabled]=useState(false);
  useEffect(()=>{getPaymentConfig().then(c=>setOnlineEnabled(c.enabled)).catch(()=>{});},[]);
  const [errorMsg, setErrorMsg] = useState("");
  const [rules,setRules]=useState<DeliveryRule[]|null>(null);
  const [deliveryError,setDeliveryError]=useState(false);
  const [checkedCart,setCheckedCart]=useState({key:"",error:""});
  const cartKey=JSON.stringify(items.map(i=>({productId:i.productId,variantId:i.id!==i.productId?i.id:null,quantity:i.quantity})));
  useEffect(()=>{let active=true;const lines=JSON.parse(cartKey);if(lines.length)getCheckoutItems(lines).then(result=>{if(!active)return;if(result.success){refreshItems(result.items);setCheckedCart({key:cartKey,error:""});}else setCheckedCart({key:cartKey,error:result.error||"Cart could not be checked."});}).catch(()=>{if(active)setCheckedCart({key:cartKey,error:"Could not check current prices. Refresh checkout."});});return ()=>{active=false;};},[cartKey,refreshItems]);
  useEffect(()=>{getDeliveryRules().then(setRules).catch(()=>setDeliveryError(true));},[]);

  // Pre-fill contact details for signed-in customers (only empty fields)
  const customer = useCustomerAuthStore((state) => state.user);
  const name = nameInput ?? customer?.name ?? "";
  const phone = phoneInput ?? customer?.phone ?? "";
  const email = emailInput ?? customer?.email ?? "";


  // Guard hydration mismatch


  // Calculations (display only — the server recomputes the real total from DB prices)
  const displayedSubtotal=items.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const quote=rules?deliveryQuote(rules,pincode.trim(),displayedSubtotal,coupon?.type==="free_delivery"):null;
  const { subtotal, deliveryCharge, discount, gstAmount, total } = useMemo(
    () => computeTotals({ lines: items, coupon, deliveryType, deliveryPolicy:quote?{charge:quote.baseCharge,freeAbove:quote.freeAbove}: {charge:0,freeAbove:null} }),
    [items, coupon, deliveryType, quote]
  );

  // Submit Handler
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !phone) {
      setErrorMsg("Please fill in your name and phone number.");
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter a valid 10-digit phone number.");
      return;
    }

    if(checkedCart.key!==cartKey||checkedCart.error){setErrorMsg(checkedCart.error||"Checking current prices and stock. Please wait.");return;}
    const isPickup = deliveryType === "pickup";

    if (!isPickup) {
      if (!line1 || !city || !pincode) {
        setErrorMsg("Please fill in all required shipping address fields.");
        return;
      }

      if (!/^\d{6}$/.test(pincode.trim())) {
        setErrorMsg("Please enter a valid 6-digit pincode.");
        return;
      }
      if (!rules || !quote) {
        setErrorMsg(!rules?"Delivery settings are still loading. Please try again.":"Outside our regular delivery area. Choose store pickup or contact us on WhatsApp to arrange delivery.");
        return;
      }
    }

    setLoading(true);

    try {
      const orderItems = items.map((item) => ({
        productId: item.productId,
        variantId: item.id !== item.productId ? item.id : null,
        quantity: item.quantity,
      }));

      const finalLine1 = isPickup ? (line1.trim() || "Goodwill Showroom Pickup (Opp. Kulappully Bus Stand)") : line1;
      const finalCity = isPickup ? (city.trim() || "Kulappully, Shoranur") : city;
      const finalPincode = isPickup ? (pincode.trim() || "679122") : pincode;

      // Call server action
      const fingerprint=JSON.stringify({phone,line1:finalLine1,city:finalCity,pincode:finalPincode,deliveryType,paymentMethod,coupon:coupon?.code,items:orderItems,total});
      const previous=sessionStorage.getItem('goodwill-checkout-attempt');
      let attempt:{fingerprint:string;key:string}|null=null;
      try {attempt=previous?JSON.parse(previous):null;}catch{}
      if(!attempt||attempt.fingerprint!==fingerprint){attempt={fingerprint,key:crypto.randomUUID()};sessionStorage.setItem('goodwill-checkout-attempt',JSON.stringify(attempt));}
      const payload = {
        requestKey:attempt.key,
        expectedTotal:total,
        name,
        phone,
        email,
        line1: finalLine1,
        city: finalCity,
        pincode: finalPincode,
        deliveryType,
        paymentMethod,
        couponCode: coupon?.code,
        notes,
        items: orderItems,
       };
      if(paymentMethod==='razorpay'){
        const payment=await startOnlinePayment(payload);
        if(!payment.success)throw Error(payment.error);
        clearCart();
        try {
          const cleanPhone = phone.replace(/\D/g, "").slice(-10);
          const existing = JSON.parse(localStorage.getItem("goodwill_recent_orders") || "[]");
          const updated = [
            { orderNumber: payment.orderNumber, phone: cleanPhone, total, date: new Date().toISOString() },
            ...existing.filter((o: { orderNumber?: string }) => o.orderNumber !== payment.orderNumber)
          ].slice(0, 5);
          localStorage.setItem("goodwill_recent_orders", JSON.stringify(updated));
        } catch {}
        try{await openGateway(payment,{name,email,contact:phone});}finally{router.push(`/track-order?orderNumber=${payment.orderNumber}&phone=${phone.replace(/\D/g, "").slice(-10)}`);}
        return;
      }
      const res=await createOrder(payload);

      if (res.success && res.orderNumber) {
        sessionStorage.removeItem("goodwill-checkout-attempt");
        try {
          const cleanPhone = phone.replace(/\D/g, "").slice(-10);
          const existing = JSON.parse(localStorage.getItem("goodwill_recent_orders") || "[]");
          const updated = [
            { orderNumber: res.orderNumber, phone: cleanPhone, total, date: new Date().toISOString() },
            ...existing.filter((o: { orderNumber?: string }) => o.orderNumber !== res.orderNumber)
          ].slice(0, 5);
          localStorage.setItem("goodwill_recent_orders", JSON.stringify(updated));
        } catch {}
        clearCart();
        // Redirect to success / tracking page
        router.push(`/track-order?orderNumber=${res.orderNumber}&phone=${phone.replace(/\D/g, "").slice(-10)}&placed=1`);
      } else {
        setErrorMsg(res.error || "Failed to place order.");
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error?err.message:"Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-paper">
        <Header />
        <div className="flex-grow flex items-center justify-center p-20">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-gold animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-paper">
        <Header />
        <main className="max-w-md mx-auto px-4 py-20 flex-grow text-center flex flex-col items-center justify-center">
          <ShoppingBag size={48} className="text-slate-300 mb-4 animate-bounce" />
          <h2 className="text-lg font-bold text-slate-800">Your cart is empty</h2>
          <p className="text-sm text-slate-500 mt-1">Add items to your cart before checking out.</p>
          <Link href="/products" className="mt-6 bg-ink text-white font-semibold text-sm px-6 py-3 rounded-full">
            Go to Catalog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />
      <PageHeader
        eyebrow="Secure checkout"
        title="Checkout"
        description="Prices include GST. Pay cash on delivery or at the showroom."
        breadcrumbs={[{ href: "/", label: "Home" }, { href: "/cart", label: "Cart" }, { label: "Checkout" }]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-grow w-full">

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form inputs */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Express Sign-in / Signed-in Banner */}
            {!customer ? (
              <div className="card-lux !transform-none p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gold/40 bg-gradient-to-r from-amber-50/50 via-white to-slate-50 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Have a Goodwill or Google account?</p>
                    <p className="text-xs text-slate-500">Sign in to auto-fill your delivery info and track your order history.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="btn-dark !py-2.5 !px-5 !text-xs shrink-0 whitespace-nowrap cursor-pointer shadow-xs"
                >
                  Sign in with Google
                </button>
              </div>
            ) : (
              <div className="card-lux !transform-none p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 border border-emerald-200/90 bg-emerald-50/50 text-emerald-950">
                <div className="flex items-center gap-3 text-xs">
                  {customer.image ? (
                    <img
                      src={customer.image}
                      alt={customer.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-emerald-300 shadow-2xs shrink-0"
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  <span>
                    Signed in as <strong className="font-semibold text-ink">{customer.name}</strong> ({customer.email})
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-white/90 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                  Details Auto-Filled
                </span>
              </div>
            )}

            {/* Delivery type toggle */}
            <div className="card-lux !transform-none p-6 flex flex-col gap-4">
              <h3 className="font-semibold text-ink text-base tracking-tight flex items-center gap-1.5">
                <Truck size={16} className="text-gold-dark" />
                <span>Delivery Method</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryType("delivery")}
                  className={`p-4 rounded-2xl border text-left font-bold text-xs transition-all flex flex-col gap-1 ${
                    deliveryType === "delivery"
                      ? "border-ink bg-paper/20 text-ink ring-2 ring-gold/20"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm">Home Delivery</span>
                  <span className="text-[11px] font-semibold text-slate-400">Delivered to your address</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("pickup")}
                  className={`p-4 rounded-2xl border text-left font-bold text-xs transition-all flex flex-col gap-1 ${
                    deliveryType === "pickup"
                      ? "border-ink bg-paper/20 text-ink ring-2 ring-gold/20"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm">Store pickup · Free</span>
                  <span className="text-[11px] font-semibold text-slate-400">Collect from Kulappully showroom</span>
                </button>
              </div>
            </div>

            {/* Shipping Address fields */}
            <div className="card-lux !transform-none p-6 md:p-8 flex flex-col gap-4">
              <h3 className="font-semibold text-ink text-base tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <User size={16} className="text-gold-dark" />
                <span>Contact & Shipping Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="checkout-name" className="text-xs font-bold text-slate-500">Full Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      id="checkout-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sajeev S"
                      className="w-full pl-9 pr-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                    />
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="checkout-phone" className="text-xs font-bold text-slate-500">Phone Number *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      id="checkout-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit mobile"
                      className="w-full pl-9 pr-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                    />
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="checkout-email" className="text-xs font-bold text-slate-500">Email Address (Optional)</label>
                  <input
                    type="email"
                    id="checkout-email"
                      value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. customer@example.com"
                    className="w-full px-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                  />
                </div>

                {deliveryType === "pickup" ? (
                  <div className="md:col-span-2 bg-amber-500/[0.08] border border-gold/30 rounded-2xl p-4 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold-dark flex items-center justify-center shrink-0">
                      <Building size={20} />
                    </div>
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-ink text-sm">Collect from Goodwill Kulappully Showroom</span>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        Opp. Kulappully Bus Stand, Palakkad–Ponnani Highway, Shoranur, Palakkad, Kerala 679122
                      </p>
                      <p className="text-slate-500 text-[11px] mt-1 font-semibold">
                        Showroom Hours: Mon – Sat: 8:00 AM – 8:00 PM (Sunday Closed) · We will have your order ready for pickup.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label htmlFor="checkout-line1" className="text-xs font-bold text-slate-500">Address / House Name *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          id="checkout-line1"
                      value={line1}
                          onChange={(e) => setLine1(e.target.value)}
                          placeholder="e.g. Sreevalsam House, Landmark details..."
                          className="w-full pl-9 pr-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                        />
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="checkout-city" className="text-xs font-bold text-slate-500">City / Village *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          id="checkout-city"
                      value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Shoranur"
                          className="w-full pl-9 pr-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                        />
                        <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="checkout-pincode" className="text-xs font-bold text-slate-500">Pincode *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        id="checkout-pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        placeholder="679122"
                        className="w-full px-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                      />
                      {pincode.trim().length === 6 && (
                        <div className="mt-1 text-xs px-1">
                          {quote ? (
                            <p className="text-emerald-700 font-semibold flex items-center gap-1.5 animate-fade-in">
                              <MapPin size={13} className="text-emerald-600 shrink-0" />
                              <span>Location: <strong className="text-emerald-950 font-bold">{quote.location || quote.zoneName}</strong> ({quote.estimate})</span>
                            </p>
                          ) : (
                            <p className="text-rose-600 font-semibold flex items-center gap-1.5 animate-fade-in">
                              <AlertCircle size={13} className="text-rose-500 shrink-0" />
                              <span>Outside Kerala delivery area</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="checkout-notes" className="text-xs font-bold text-slate-500">
                    {deliveryType === "pickup" ? "Note for the shop (optional)" : "Delivery instructions (optional)"}
                  </label>
                  <textarea
                    id="checkout-notes"
                    rows={2}
                    maxLength={300}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={deliveryType === "pickup" ? "e.g. I will collect after 5 pm" : "e.g. Call before coming, site is behind the temple"}
                    className="w-full px-4 py-2.5 border border-ink/10 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method fields */}
            <div className="card-lux !transform-none p-6 flex flex-col gap-4">
              <h3 className="font-semibold text-ink text-base tracking-tight flex items-center gap-1.5">
                <CreditCard size={16} className="text-gold-dark" />
                <span>Payment Options</span>
              </h3>
              {checkedCart.key!==cartKey&&<p role="status" className="text-sm text-slate-500">Checking current prices and stock…</p>}
              {checkedCart.error&&<p role="alert" className="text-sm text-red-600">{checkedCart.error} <Link href="/cart" className="underline">Edit cart</Link></p>}
              {deliveryType === 'delivery' && <p role="status" className="text-sm text-slate-500">{deliveryError?'Delivery settings could not load. Refresh or choose pickup.':!rules?'Loading delivery settings…':quote?`${quote.zoneName}: ${quote.estimate}. Delivery Rs ${quote.charge}.`:'Enter a serviceable pincode to calculate delivery.'}</p>}
              {onlineEnabled&&<label className="flex gap-3 p-4 border border-ink/10 rounded-xl text-sm mb-3"><input type="radio" name="payment-choice" checked={paymentMethod==='razorpay'} onChange={()=>setPaymentMethod('razorpay')}/>Online payment (UPI, Cards, NetBanking)</label>}
              {onlineEnabled&&<label className="flex gap-3 text-sm mb-3"><input type="radio" name="payment-choice" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')}/>Pay at delivery / showroom</label>}

              <div className="p-4 rounded-2xl border border-ink bg-paper/60 ring-2 ring-gold/20 flex items-start gap-3">
                <span className="mt-0.5 w-4 h-4 rounded-full border-[5px] border-ink bg-white flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-ink">
                    {deliveryType === "pickup" ? "Pay at showroom" : "Cash on delivery"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {deliveryType === "pickup"
                      ? "Pay by cash or UPI when you collect your order."
                      : "Pay by cash or UPI when your order is delivered."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout sidebar panel */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-32">
            <div className="card-lux !transform-none p-6 flex flex-col gap-4">
              <h3 className="font-semibold text-ink text-base tracking-tight">Order Summary</h3>

              {/* Items checklist */}
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-700 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-bold">
                        Qty: {item.quantity} x ₹{formatINR(item.price)}
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 pl-2">₹{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals split */}
              <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-bold border-y border-slate-100 py-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800">₹{formatINR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-₹{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (included)</span>
                  <span>₹{formatINR(gstAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-slate-800">
                    {deliveryType === "delivery" && !quote ? "Enter pincode" : deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-ink">Grand Total</span>
                <span className="text-2xl font-bold text-ink leading-none">₹{formatINR(total)}</span>
              </div>

              {errorMsg && <p className="text-xs font-semibold text-red-500 mt-2">{errorMsg}</p>}

              <button
                type="submit"
                disabled={loading || checkedCart.key!==cartKey || !!checkedCart.error || (deliveryType === "delivery" && (!rules || deliveryError || !quote))}
                className="w-full bg-ink hover:bg-ink-2 text-white font-semibold text-sm py-4 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 mt-4 disabled:bg-slate-300 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                ) : (
                  <span>Place Order</span>
                )}
              </button>

              <div className="text-[11px] text-slate-400 font-bold text-center mt-2 flex items-center justify-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Prices include GST · Checked at confirmation</span>
              </div>
            </div>

            {/* Coupons & Special Offers */}
            <AvailableCoupons
              subtotal={subtotal}
              appliedCoupon={coupon}
              onApplyCoupon={(c) => setCoupon(c)}
              onRemoveCoupon={() => setCoupon(null)}
            />
          </div>
        </form>
      </main>

      <CustomerAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <Footer />
    </div>
  );
}
