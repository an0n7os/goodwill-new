import React from "react";
import { Check, X } from "lucide-react";
import { orderSteps, statusLabel, STATUS_HINTS } from "@/lib/orderStatus";

type Event = { id: string; status: string; note: string | null; createdAt: Date | string };

function when(d: Date | string) {
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

// "Where is my order": every step with the time it happened and any note from the shop
export default function OrderTimeline({
  status,
  deliveryType,
  events,
  compact = false,
}: {
  status: string;
  deliveryType: string;
  events: Event[];
  compact?: boolean;
}) {
  const steps = orderSteps(deliveryType);
  const stopped = status === "CANCELLED" || status === "RETURNED";
  const reached = stopped
    ? Math.max(...events.filter((e) => steps.includes(e.status as never)).map((e) => steps.indexOf(e.status as never)), 0)
    : Math.max(steps.indexOf(status as never), 0);

  // Latest event per step (an order can move back and forth)
  const eventFor = (step: string) => [...events].reverse().find((e) => e.status === step);

  const rows = steps.slice(0, stopped ? reached + 1 : steps.length).map((step, i) => ({
    key: step,
    label: statusLabel(step, deliveryType),
    done: i <= reached,
    current: !stopped && i === reached,
    event: eventFor(step),
  }));
  if (stopped) {
    rows.push({ key: status, label: statusLabel(status), done: true, current: true, event: eventFor(status) });
  }

  // Notes added without a status change appear under the step they were written on
  const extraNotes = (step: string, shown?: Event) => events.filter((e) => e.status === step && e.note && e.id !== shown?.id);

  return (
    <ol className="relative flex flex-col">
      {rows.map((row, i) => {
        const isLast = i === rows.length - 1;
        const failed = row.key === "CANCELLED" || row.key === "RETURNED";
        return (
          <li key={row.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span className={`absolute left-[15px] top-8 bottom-0 w-[2px] ${rows[i + 1].done ? "bg-ink" : "bg-slate-200"}`} aria-hidden />
            )}
            <span
              className={`relative z-10 w-8 h-8 flex-shrink-0 rounded-full border flex items-center justify-center ${
                failed
                  ? "bg-red-600 border-red-600 text-white"
                  : row.done
                  ? "bg-ink border-ink text-white"
                  : "bg-white border-slate-300 text-slate-400"
              } ${row.current && !failed ? "ring-4 ring-gold/25" : ""}`}
            >
              {failed ? <X size={15} /> : row.done ? <Check size={15} /> : <span className="text-xs font-semibold">{i + 1}</span>}
            </span>
            <div className="pt-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={`text-sm font-semibold ${row.done ? "text-ink" : "text-slate-400"}`}>{row.label}</span>
                {row.event && <span className="text-xs text-slate-400">{when(row.event.createdAt)}</span>}
              </div>
              {!compact && (row.current || row.event?.note) && (
                <p className={`text-[13px] mt-0.5 ${failed ? "text-red-600" : "text-slate-500"}`}>{row.event?.note || STATUS_HINTS[row.key]}</p>
              )}
              {!compact &&
                extraNotes(row.key, row.event).map((e) => (
                  <p key={e.id} className="text-[13px] text-slate-500 mt-0.5">
                    {e.note} <span className="text-xs text-slate-400">· {when(e.createdAt)}</span>
                  </p>
                ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
