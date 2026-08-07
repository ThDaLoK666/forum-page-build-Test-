"use client";

import { useRef, useState, useEffect } from "react";
import { BookOpen, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "study-session";

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters = [
  { id: "all" as const, label: "All", icon: null },
  { id: "study-session" as const, label: "Study Session", icon: BookOpen },
];

export function FilterTabs({ activeFilter, onFilterChange }: FilterTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      setCanScrollLeft(scrollRef.current.scrollLeft > 0);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      checkScroll();
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -120, behavior: "smooth" });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={scrollLeft}
        className={cn(
          "flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-all",
          canScrollLeft ? "opacity-100" : "opacity-40"
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="relative overflow-hidden rounded-full bg-card shadow-sm border border-border/50">
        <div
          ref={scrollRef}
          className="flex items-center gap-0.5 p-1 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            const Icon = filter.icon;
            const isStudySession = filter.id === "study-session";

            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap flex-shrink-0",
                  isStudySession && isActive
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200"
                    : isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type { FilterType };
