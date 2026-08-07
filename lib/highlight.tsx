import React from "react";

/**
 * Highlight occurrences of `query` inside `text`.
 * Returns plain text when there is no query so existing UI is unchanged.
 */
export function highlightText(text: string, query: string): React.ReactNode {
  const q = query?.trim();
  if (!q || !text) return text;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  const lower = q.toLowerCase();

  return parts.map((part, i) =>
    part.toLowerCase() === lower ? (
      <mark
        key={i}
        className="bg-yellow-200 dark:bg-yellow-500/30 text-inherit rounded-sm px-0.5"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}
