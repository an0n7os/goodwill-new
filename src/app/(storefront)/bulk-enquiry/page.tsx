"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { useLanguageStore } from "@/store/language";
import { createEnquiry } from "@/lib/actions";
import { Send, CheckCircle, PhoneCall, FileSpreadsheet, ShieldCheck } from "lucide-react";

export default function BulkEnquiryPage() {
  const { t } = useLanguageStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [projectName, setProjectName] = useState("");
  const [requirement, setRequirement] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccess(false);

    if (!name || !phone || !requirement) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await createEnquiry({
        name,
        phone,
        email,
        projectName,
        requirement,
      });

      if (res.success) {
        setSuccess(true);
        setName("");
        setPhone("");
        setEmail("");
        setProjectName("");
        setRequirement("");
      } else {
        setErrorMsg(res.error || "Failed to submit enquiry.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />
      <PageHeader
        width="5xl"
        eyebrow="Contractors & builders"
        title="Request a"
        accent="bulk quote."
        description={t(
          "Building a house, villa or commercial site? Send your list of electrical, plumbing or sanitary items and get direct company pricing.",
          "പൈപ്പുകൾ, ഫിറ്റിംഗ്സ്, വയറിംഗ് സാധനങ്ങൾ എന്നിവയുടെ ലിസ്റ്റ് താഴെ നൽകുക. കമ്പനി വിലയിൽ മികച്ച ക്വട്ടേഷൻ ലഭ്യമാക്കുന്നതാണ്."
        )}
        breadcrumbs={[{ href: "/", label: "Home" }, { label: "Bulk quote" }]}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-grow w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Form */}
          <div className="md:col-span-2 card-lux !transform-none p-6 md:p-8">
            {success ? (
              <div className="flex flex-col items-center text-center p-8 animate-fade-in">
                <CheckCircle size={48} className="text-emerald-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-800">Enquiry Submitted Successfully!</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                  Thank you! Our shop managers will review your list and contact you on WhatsApp with a customized quotation within 24 hours.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-6 bg-ink text-white font-semibold text-sm px-6 py-3 rounded-full transition-all"
                >
                  Send Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sajeev S"
                      className="w-full px-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Phone Number (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="WhatsApp mobile number"
                      className="w-full px-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contractor@gmail.com"
                      className="w-full px-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Project / Site Name (Optional)</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Shoranur Villa Project"
                      className="w-full px-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">List of Materials / Requirements *</label>
                  <textarea
                    required
                    rows={6}
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder="e.g.
1. Supreme 1 inch CPVC Pipe - 30 pieces
2. Legrand 10A switch - 150 numbers
3. CERA Campbell Wall Closet - 4 numbers..."
                    className="w-full px-5 py-4 border border-ink/10 rounded-3xl bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm whitespace-pre-line"
                  ></textarea>
                </div>

                {errorMsg && <p className="text-xs font-semibold text-red-500">{errorMsg}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-ink hover:bg-ink-2 text-white font-semibold text-sm py-4 rounded-full shadow transition-colors flex items-center justify-center gap-1.5 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Materials List</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Quick info panel */}
          <div className="flex flex-col gap-6">
            <div className="bg-ink text-white rounded-3xl p-6 border border-slate-800 shadow-lg flex flex-col gap-4">
              <h3 className="font-semibold text-base tracking-tight flex items-center gap-1.5">
                <FileSpreadsheet size={16} className="text-gold-light" />
                <span>Alternate methods</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you have a BOQ spreadsheet (Excel/PDF) or a handwritten paper note, you can snap a photo or send the file directly to us on WhatsApp.
              </p>
              <a
                href="https://wa.me/919744164444"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-3.5 rounded-full shadow flex items-center justify-center gap-2 transition-colors text-center"
              >
                <span>WhatsApp Materials List</span>
              </a>
            </div>

            <div className="card-lux !transform-none p-6 flex flex-col gap-4">
              <h3 className="font-semibold text-ink text-base tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <PhoneCall size={16} className="text-gold-dark" />
                <span>Call support</span>
              </h3>
              <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-bold">
                <div className="flex justify-between">
                  <span>Showroom Support</span>
                  <a href="tel:+919744164444" className="text-slate-800 hover:underline">9744164444</a>
                </div>
                <div className="flex justify-between">
                  <span>Owner Contact</span>
                  <a href="tel:+919961898888" className="text-slate-800 hover:underline">9961898888</a>
                </div>
                <div className="flex justify-between">
                  <span>Office Direct</span>
                  <a href="tel:+919544554555" className="text-slate-800 hover:underline">9544554555</a>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-semibold flex items-start gap-1.5">
              <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
              <span>We verify raw materials stock levels in real time before quoting, ensuring exact price quotes.</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
