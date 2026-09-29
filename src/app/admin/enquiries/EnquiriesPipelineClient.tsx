"use client";

import React, { useState, useTransition } from "react";
import { updateEnquiryStatus } from "@/lib/actions";
import { MessageSquare, User, Calendar, ArrowRightLeft, Plus, X } from "lucide-react";

interface EnquiriesPipelineClientProps {
  enquiries: any[];
}

function formatDateDeterministic(dateInput: string | Date) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export default function EnquiriesPipelineClient({ enquiries }: EnquiriesPipelineClientProps) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadProject, setLeadProject] = useState("");
  const [leadRequirement, setLeadRequirement] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const stages = [
    { key: "new", name: "New Leads", color: "bg-ink/10 text-gold-dark border-ink/10" },
    { key: "contacted", name: "Contacted", color: "bg-amber-600/10 text-amber-600 border-amber-200" },
    { key: "quoted_sent", name: "Quote Sent", color: "bg-ink/10 text-gold-dark border-ink/10" },
    { key: "won", name: "Won (Order)", color: "bg-emerald-600/10 text-emerald-600 border-emerald-200" },
    { key: "lost", name: "Lost", color: "bg-slate-500/10 text-slate-500 border-slate-200" },
  ];

  // Move Enquiry Stage
  const handleMoveStage = (enquiryId: string, newStage: string) => {
    startTransition(async () => {
      const res = await updateEnquiryStatus(enquiryId, newStage);
      if (!res.success) {
        alert(res.error || "Failed to update lead stage.");
      }
    });
  };

  // WhatsApp Follow up link generator
  const getWhatsAppFollowupUrl = (enquiry: any) => {
    const text = `Hi ${enquiry.name}, this is Goodwill Electrical World regarding your quote request for: ${enquiry.projectName || "your requirements"}. Let us know if you have received the pricing sheet or have any additions.`;
    return `https://wa.me/91${enquiry.phone}?text=${encodeURIComponent(text)}`;
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { createEnquiry } = await import("@/lib/actions");
    const res = await createEnquiry({
      name: leadName,
      phone: leadPhone,
      projectName: leadProject,
      requirement: leadRequirement,
    });
    setSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
      setLeadName("");
      setLeadPhone("");
      setLeadProject("");
      setLeadRequirement("");
      alert("Counter enquiry created successfully!");
    } else {
      alert(res.error || "Failed to create lead.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Row */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Contractor Pipeline Kanban</h3>
          <p className="text-[11px] font-bold text-slate-400">Track and respond to material quotation requests.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-ink hover:bg-gold text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Counter Lead</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start overflow-x-auto pb-4">
      {stages.map((stage) => {
        // Filter enquiries in this stage
        const stageEnquiries = enquiries.filter((e) => e.status === stage.key);

        return (
          <div
            key={stage.key}
            className="flex flex-col gap-4 bg-slate-100/60 p-4 rounded-2xl border border-slate-200/50 min-w-[240px] flex-shrink-0"
          >
            {/* Stage Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${stage.color}`}>
                  {stageEnquiries.length}
                </span>
                <h3 className="font-bold text-slate-800 text-xs">{stage.name}</h3>
              </div>
            </div>

            {/* Enquiries Cards */}
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {stageEnquiries.length > 0 ? (
                stageEnquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className="bg-white p-4 rounded-xl border border-slate-200/40 shadow-sm flex flex-col gap-3 hover:shadow hover:border-slate-300 transition-all"
                  >
                    <div>
                      {enq.projectName && (
                        <span className="bg-slate-100 text-slate-600 font-semibold text-[11px] px-2 py-0.5 rounded uppercase tracking-wider block w-fit mb-1.5">
                          {enq.projectName}
                        </span>
                      )}
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        <span>{enq.name}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDateDeterministic(enq.createdAt)}</span>
                      </p>
                    </div>

                    {/* Requirements description */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-500 font-medium leading-relaxed max-h-24 overflow-y-auto whitespace-pre-line">
                      {enq.requirement}
                    </div>

                    {/* Contact & Stage Action */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                      {/* WhatsApp trigger */}
                      <a
                        href={getWhatsAppFollowupUrl(enq)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm transition-colors text-center"
                      >
                        <MessageSquare size={10} className="fill-current" />
                        <span>Follow Up (WA)</span>
                      </a>

                      {/* Stage selector dropdown */}
                      <div className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500">
                        <ArrowRightLeft size={10} className="text-slate-400" />
                        <select
                          disabled={isPending}
                          value={enq.status}
                          onChange={(e) => handleMoveStage(enq.id, e.target.value)}
                          className="bg-transparent focus:outline-none w-full font-bold text-slate-700 cursor-pointer"
                        >
                          {stages.map((st) => (
                            <option key={st.key} value={st.key}>
                              Move to: {st.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-8 font-semibold uppercase tracking-wider">Empty stage</p>
              )}
            </div>
          </div>
        );
      })}
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-ink uppercase tracking-wide">Add Counter Lead</h3>
                <p className="text-[11px] text-slate-400 font-bold">Record a walk-in contractor's quote request.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Contractor / Customer Name *</label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="e.g. Ramesh Electricals"
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">WhatsApp Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 9876543210"
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Project / Site Name (Optional)</label>
                <input
                  type="text"
                  value={leadProject}
                  onChange={(e) => setLeadProject(e.target.value)}
                  placeholder="e.g. Shoranur Villa"
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Material Requirements *</label>
                <textarea
                  required
                  rows={4}
                  value={leadRequirement}
                  onChange={(e) => setLeadRequirement(e.target.value)}
                  placeholder="e.g. 2.5sq mm wire - 10 rolls, 16A switch - 50 pcs..."
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-xs font-semibold"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ink hover:bg-gold text-white font-semibold text-sm py-3.5 rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                {submitting ? "Saving..." : "Save Lead to Kanban"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
