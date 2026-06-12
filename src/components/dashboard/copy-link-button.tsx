"use client";

import { useState } from "react";

type Props = {
  url: string;
};

export function CopyLinkButton({ url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="inline-flex items-center gap-1.5 rounded-xl border border-primary-200/50 bg-primary-500/10 px-4 py-2 text-xs font-bold text-primary-700 backdrop-blur-md transition-all duration-300 hover:scale-102 hover:bg-primary-500/20 dark:border-primary-500/20 dark:bg-primary-500/15 dark:text-primary-300 cursor-pointer shadow-sm"
    >
      {copied ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>¡Copiado!</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <span>Copiar enlace</span>
        </>
      )}
    </button>
  );
}
