import React from "react";
import Image from "next/image";

// Goodwill wordmark (public/brand/*.png, aspect ~3.04:1) with the "Electrical World" line
// sized to sit flush under it. `tone="light"` is for dark backgrounds.
export default function BrandLogo({
  tone = "dark",
  size = "md",
  subtitle = "Electrical World",
  priority = false,
}: {
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  subtitle?: string | null;
  priority?: boolean;
}) {
  const heights = { sm: 28, md: 38, lg: 46 } as const;
  const h = heights[size];
  const w = Math.round(h * 3.04);
  const src = tone === "light" ? "/brand/goodwill-logo-light.png" : "/brand/goodwill-logo-dark.png";

  return (
    <span className="inline-flex flex-col items-stretch" style={{ width: w }}>
      <Image src={src} alt="Goodwill" width={w} height={h} priority={priority} className="block h-auto w-full select-none" />
      {subtitle && (
        <span
          className={`mt-1.5 flex justify-between font-semibold uppercase leading-none ${
            tone === "light" ? "text-gold-light" : "text-gold-dark"
          }`}
          style={{ fontSize: Math.max(7, Math.round(h * 0.27)) }}
          aria-hidden="true"
        >
          {/* Letters spread edge-to-edge so the line matches the wordmark width */}
          {subtitle.split("").map((ch, i) => (
            <span key={i}>{ch === " " ? " " : ch}</span>
          ))}
        </span>
      )}
    </span>
  );
}
