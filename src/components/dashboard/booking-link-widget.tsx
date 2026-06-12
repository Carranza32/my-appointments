"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import Link from "next/link";

type Props = {
  url: string;
  slug: string;
};

export function BookingLinkWidget({ url, slug }: Props) {
  const [copied, setCopied] = useState(false);

  // Shorten the display url for cleaner mockup aesthetic
  const displayUrl = `myappt.io/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <h3 className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200">
          Booking Link
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-normal">
          Share your personalized link for clients to book themselves.
        </p>

        {/* Link container */}
        <div className="mt-4 flex items-center justify-between gap-2 p-3 rounded-xl bg-blue-50/40 border border-blue-100/30 dark:bg-slate-900/60 dark:border-slate-800/40">
          <span className="font-mono text-xs font-semibold text-[#1A73E8] dark:text-blue-400 truncate select-all">
            {displayUrl}
          </span>
          <button
            onClick={handleCopy}
            type="button"
            className="p-1 rounded-lg hover:bg-blue-100/50 dark:hover:bg-slate-800 text-slate-400 hover:text-[#1A73E8] dark:hover:text-blue-400 transition-all cursor-pointer"
            title="Copy link"
          >
            {copied ? (
              <Check className="h-4.5 w-4.5 text-emerald-500" />
            ) : (
              <Copy className="h-4.5 w-4.5 text-slate-400 hover:text-[#1A73E8]" />
            )}
          </button>
        </div>
      </div>

      <Link
        href="/dashboard/settings"
        className="mt-6 flex items-center justify-center bg-[#1A73E8] hover:bg-[#005bbf] text-white py-3 rounded-xl text-sm font-extrabold shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-98 transition-all cursor-pointer select-none"
      >
        Edit Availability
      </Link>
    </div>
  );
}
