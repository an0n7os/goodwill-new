"use client";

import React, { useState } from "react";
import { Star, CheckCircle2, MapPin, ThumbsUp, MessageSquarePlus, X, ChevronDown } from "lucide-react";
import { createProductReview, type ProductReviewsSummary, type ReviewData } from "@/lib/actions";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  initialSummary: ProductReviewsSummary;
  compact?: boolean;
}

export default function ProductReviewsSection({
  productId,
  productName,
  initialSummary,
}: ProductReviewsSectionProps) {
  const [summary, setSummary] = useState<ProductReviewsSummary>(initialSummary);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [authorCity, setAuthorCity] = useState("Shoranur");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [helpfulIds, setHelpfulIds] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      setErrorMsg("Please share at least a few words about your experience.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createProductReview({
        productId,
        rating,
        authorName,
        authorCity,
        title: title || undefined,
        comment,
      });

      if (res.success && res.review) {
        setSuccessMsg("Thank you! Your verified review has been submitted.");
        const newReview: ReviewData = res.review;
        setSummary((prev) => {
          const newTotal = prev.totalReviews + 1;
          const newDist = { ...prev.distribution, [rating]: (prev.distribution[rating] || 0) + 1 };
          const sum =
            Object.entries(newDist).reduce((acc, [stars, count]) => acc + Number(stars) * count, 0);
          return {
            averageRating: Number((sum / newTotal).toFixed(1)),
            totalReviews: newTotal,
            distribution: newDist,
            reviews: [newReview, ...prev.reviews],
          };
        });

        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMsg("");
          setTitle("");
          setComment("");
        }, 1500);
      } else {
        setErrorMsg(res.error || "Could not submit review.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHelpful = (id: string) => {
    setHelpfulIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalReviews = Math.max(1, summary.totalReviews);
  const visibleReviews = showAll ? summary.reviews : summary.reviews.slice(0, 3);

  return (
    <div id="customer-reviews" className="w-full">
      {/* Compact Score Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-paper/60 border border-ink/[0.07] mb-5">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold tracking-tight text-ink font-display">
            {summary.averageRating.toFixed(1)}
          </div>
          <div>
            <div className="flex items-center gap-0.5 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={15}
                  className={star <= Math.round(summary.averageRating) ? "fill-amber-400 text-amber-500" : "text-slate-200"}
                />
              ))}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {summary.totalReviews} verified Kerala buyer reviews
            </div>
          </div>
        </div>

        {/* Small Breakdown Bars */}
        <div className="hidden md:flex flex-col gap-1 w-48 shrink-0">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[stars] || 0;
            const percentage = Math.round((count / totalReviews) * 100);
            return (
              <div key={stars} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-4 text-slate-400 font-medium">{stars}★</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                </div>
                <span className="w-5 text-right text-slate-400 font-mono text-[9px]">{count}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-outline !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-auto hover:bg-white"
        >
          <MessageSquarePlus size={14} />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Compact Reviews List */}
      <div className="flex flex-col divide-y divide-ink/[0.06]">
        {visibleReviews.map((rev) => (
          <div key={rev.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink text-xs">{rev.authorName}</span>
                {rev.authorCity && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                    <MapPin size={10} className="text-slate-400" />
                    {rev.authorCity}
                  </span>
                )}
                {rev.isVerified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                    <CheckCircle2 size={10} className="text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={11}
                    className={s <= rev.rating ? "fill-amber-400 text-amber-500" : "text-slate-200"}
                  />
                ))}
              </div>
            </div>

            {rev.title && <h4 className="font-semibold text-ink text-xs">{rev.title}</h4>}
            <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
              <span>
                {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={() => toggleHelpful(rev.id)}
                className={`inline-flex items-center gap-1 transition-colors ${
                  helpfulIds[rev.id] ? "text-emerald-700 font-semibold" : "hover:text-ink text-slate-400"
                }`}
              >
                <ThumbsUp size={11} className={helpfulIds[rev.id] ? "fill-emerald-600" : ""} />
                <span>{helpfulIds[rev.id] ? "Helpful (1)" : "Helpful"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {summary.reviews.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs font-semibold text-gold-dark hover:underline flex items-center gap-1 mx-auto"
        >
          <span>{showAll ? "Show less" : `View all ${summary.reviews.length} reviews`}</span>
          <ChevronDown size={13} className={showAll ? "rotate-180" : ""} />
        </button>
      )}

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-ink/10 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-paper hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="mb-4">
              <span className="eyebrow">Rate this product</span>
              <h3 className="text-lg font-bold text-ink mt-1">Write a Customer Review</h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{productName}</p>
            </div>

            {successMsg ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-900 my-4">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2" />
                <h4 className="font-bold text-sm">Review Submitted!</h4>
                <p className="text-xs text-emerald-700 mt-1">{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={24}
                          className={
                            star <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-500"
                              : "text-slate-200"
                          }
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-slate-600 ml-2">
                      {rating === 5 ? "Excellent" : rating === 4 ? "Very Good" : rating === 3 ? "Average" : "Fair"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Suresh Kumar"
                      className="w-full h-9 px-3 rounded-xl border border-ink/15 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Town / City
                    </label>
                    <input
                      type="text"
                      value={authorCity}
                      onChange={(e) => setAuthorCity(e.target.value)}
                      placeholder="e.g. Shoranur"
                      className="w-full h-9 px-3 rounded-xl border border-ink/15 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Review Headline (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Reliable build, genuine bill"
                    className="w-full h-9 px-3 rounded-xl border border-ink/15 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Review *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with product quality, installation, or local delivery..."
                    className="w-full p-2.5 rounded-xl border border-ink/15 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                    {errorMsg}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-outline !py-2 !px-3.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-dark !py-2 !px-4 text-xs font-semibold"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
