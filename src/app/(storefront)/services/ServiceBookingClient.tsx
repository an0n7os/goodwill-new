"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCustomerAuthStore } from "@/store/customerAuth";
import { createServiceRequest } from "@/lib/actions";
import {
  Wrench,
  Zap,
  Droplets,
  Flame,
  Home,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface ServiceOption {
  id: string;
  title: string;
  titleML: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: "Electrical Work & Wiring",
    title: "Electrical Work & Wiring",
    titleML: "ഇലക്ട്രിക്കൽ വയറിംഗ് & ഫിറ്റിംഗ്",
    desc: "Switchboard fitting, MCB/DB replacement, fan/lighting installation, and inverter wiring.",
    icon: Zap,
  },
  {
    id: "Plumbing & Sanitary Fitting",
    title: "Plumbing & Sanitary Fitting",
    titleML: "പ്ലംബിംഗ് & സാനിറ്ററി ഫിറ്റിംഗ്",
    desc: "WC & commode installation, wash basin, concealed shower diverters, and pipe leakages.",
    icon: Droplets,
  },
  {
    id: "Geyser & Water Heater Installation",
    title: "Geyser & Water Heater Installation",
    titleML: "വാട്ടർ ഹീറ്റർ ഫിറ്റിംഗ്",
    desc: "Safe wall mounting, inlet/outlet braided connection pipes, and electrical hookup.",
    icon: Flame,
  },
  {
    id: "Free Site Visit & Material Estimation",
    title: "Free Site Visit & Estimation",
    titleML: "ഫ്രീ സൈറ്റ് വിസിറ്റ് & എസ്റ്റിമേഷൻ",
    desc: "Expert inspection at your construction/renovation site to prepare an accurate material list.",
    icon: Home,
  },
];

export default function ServiceBookingClient() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "Electrical Work & Wiring";
  const initialProduct = searchParams.get("product") || "";

  const user = useCustomerAuthStore((s) => s.user);

  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [location, setLocation] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("Morning (9 AM – 1 PM)");
  const [details, setDetails] = useState(
    initialProduct ? `Installation for product: ${initialProduct}` : ""
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState<{
    id: string;
    serviceType: string;
    name: string;
    phone: string;
    location: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!location.trim()) {
      setErrorMsg("Please enter your house name, street, or town location.");
      return;
    }

    setLoading(true);

    const fullDetails = [
      timeSlot ? `Preferred Slot: ${timeSlot}` : "",
      details.trim(),
    ]
      .filter(Boolean)
      .join(" · ");

    try {
      const res = await createServiceRequest({
        serviceType: selectedType,
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        location: location.trim(),
        preferredDate: preferredDate || undefined,
        details: fullDetails,
      });

      if (res.success && res.request) {
        setSubmittedRequest(res.request);
      } else {
        setErrorMsg(res.error || "Failed to submit request. Please try again.");
      }
    } catch {
      setErrorMsg("Something went wrong while connecting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submittedRequest) {
    const waText = `Hi Goodwill Electrical World,
I have booked a service request on your website:
Ref: #${submittedRequest.id.slice(-6).toUpperCase()}
Service: ${submittedRequest.serviceType}
Name: ${submittedRequest.name}
Phone: ${submittedRequest.phone}
Location: ${submittedRequest.location}
${preferredDate ? `Preferred Date: ${preferredDate} (${timeSlot})` : ""}
Please confirm the technician schedule.`;

    const waUrl = `https://wa.me/919744164444?text=${encodeURIComponent(waText)}`;

    return (
      <div className="max-w-xl mx-auto card-lux !transform-none p-8 md:p-10 text-center bg-white border border-emerald-500/20 shadow-sm animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <CheckCircle2 size={32} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Booking Confirmed
        </span>
        <h2 className="text-2xl font-bold text-ink mt-3">We have received your booking!</h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Thank you, <strong className="text-ink font-semibold">{submittedRequest.name}</strong>. Our team in Kulappully has logged your request in our dispatch system. We will contact you at <strong>+91 {submittedRequest.phone}</strong> shortly to confirm your slot.
        </p>

        <div className="my-6 p-4 rounded-2xl bg-paper/80 border border-ink/[0.06] text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Service:</span>
            <span className="font-semibold text-ink">{submittedRequest.serviceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Location:</span>
            <span className="font-semibold text-ink">{submittedRequest.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Reference:</span>
            <span className="font-mono font-bold text-gold-dark">#{submittedRequest.id.slice(-6).toUpperCase()}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
          >
            <MessageSquare size={16} />
            <span>Confirm on WhatsApp</span>
          </a>
          <Link
            href="/account"
            className="btn-outline !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <span>View in My Account</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Left side: Service categories & assurance */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">
            Certified Installation & Services
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-ink mt-1.5 leading-tight">
            Expert plumbers & electricians for your home or site.
          </h2>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Choose your required service. Our trained technicians service Kulappully, Shoranur, Ottapalam, Pattambi, and surrounding Kerala locations with standard Goodwill workmanship guarantee.
          </p>
        </div>

        {/* Service cards */}
        <div className="flex flex-col gap-3">
          {SERVICE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedType(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-4 ${
                  isSelected
                    ? "bg-white border-gold shadow-md ring-2 ring-gold/20"
                    : "bg-white/70 border-ink/[0.08] hover:bg-white hover:border-gold/50"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "bg-gold text-ink" : "bg-paper text-slate-600"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-ink">{opt.title}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-gold shrink-0 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-gold-dark mt-0.5">{opt.titleML}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quality assurances */}
        <div className="p-4 rounded-2xl bg-white border border-ink/[0.08] flex items-center gap-4">
          <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-ink font-semibold block text-sm">Verified Goodwill Technicians</strong>
            All plumbing and electrical work is done by experienced local tradesmen with standard installation charges.
          </div>
        </div>
      </div>

      {/* Right side: Booking Form */}
      <div className="lg:col-span-7">
        <div className="card-lux !transform-none p-6 md:p-8 bg-white border border-ink/[0.08]">
          <div className="pb-4 mb-6 border-b border-ink/[0.06]">
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              <Wrench size={18} className="text-gold-dark" />
              <span>Book Appointment</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selected service: <strong className="text-ink">{selectedType}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-fade-in">
                {errorMsg}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Your Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full pl-9 pr-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                  />
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Mobile Number *</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit phone"
                    className="w-full pl-9 pr-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                  />
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Location / Address *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Kulappully, Shoranur"
                    className="w-full pl-9 pr-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                  />
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Preferred Date</label>
                <div className="relative">
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                  />
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Preferred Time Slot</label>
                <div className="relative">
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold appearance-none"
                  >
                    <option value="Morning (9 AM – 1 PM)">Morning (9 AM – 1 PM)</option>
                    <option value="Afternoon (2 PM – 6 PM)">Afternoon (2 PM – 6 PM)</option>
                    <option value="Anytime">Anytime during shop hours</option>
                  </select>
                  <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Requirements or Product Notes (Optional)</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Mention specific brand, number of points, model, or description of the issue..."
                className="w-full p-4 border border-ink/10 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold !py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  <span>Submitting booking…</span>
                </>
              ) : (
                <>
                  <span>Confirm Service Booking</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
