"use client";

import { useState, useEffect, useCallback } from "react";

export type VoteValue = 1 | -1 | 0;

const STORAGE_KEY = "forumVotes";

function readAll(): Record<string, VoteValue> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAll(votes: Record<string, VoteValue>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
    window.dispatchEvent(new CustomEvent("forum-votes-changed"));
  } catch {
    /* storage full or unavailable */
  }
}

/**
 * Persisted up/down vote for any votable entity.
 * `key` should be stable, e.g. "question:12", "answer:34", "reply:56".
 */
export function useVote(key: string) {
  const [value, setValue] = useState<VoteValue>(0);

  // Hydrate after mount so server and client markup match
  useEffect(() => {
    setValue(readAll()[key] ?? 0);
  }, [key]);

  // Stay in sync if another component on the page votes on the same entity
  useEffect(() => {
    const sync = () => setValue(readAll()[key] ?? 0);
    window.addEventListener("forum-votes-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("forum-votes-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [key]);

  const vote = useCallback(
    (direction: 1 | -1) => {
      const all = readAll();
      const current = all[key] ?? 0;
      const next: VoteValue = current === direction ? 0 : direction;

      if (next === 0) {
        delete all[key];
      } else {
        all[key] = next;
      }

      writeAll(all);
      setValue(next);
      return next - current; // delta to apply to the displayed score
    },
    [key]
  );

  return {
    value,
    votedUp: value === 1,
    votedDown: value === -1,
    /** net offset to add to the base score */
    offset: value,
    vote,
  };
}

/** Read a stored vote without subscribing (used for sorting). */
export function getStoredVote(key: string): VoteValue {
  return readAll()[key] ?? 0;
}
