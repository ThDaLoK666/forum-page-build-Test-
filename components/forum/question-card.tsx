"use client";

import { CheckCircle2, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface QuestionCardProps {
  id: number;
  title: string;
  tags: string[];
  author: {
    name: string;
    initials: string;
    year: string;
    department: string;
  };
  comments: number;
  subject: string;
  subjectColor: string;
  isSolved?: boolean;
  isVerified?: boolean;
}

export function QuestionCard({
  title,
  tags,
  author,
  comments,
  subject,
  subjectColor,
  isSolved = false,
  isVerified = false,
}: QuestionCardProps) {
  return (
    <Card className="p-0 gap-0 hover:shadow-md transition-shadow cursor-pointer">
      <div className="p-5">
        {/* Status Badges */}
        <div className="flex items-center gap-2 mb-4">
          {isSolved && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Solved
            </span>
          )}
          {isVerified && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 text-cyan-600 text-xs font-medium rounded-full border border-cyan-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-4 leading-tight">
          {title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full border border-border"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Author and Comments */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 bg-teal-500">
              <AvatarFallback className="bg-teal-500 text-white text-xs font-semibold">
                {author.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                {author.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {author.year} • {author.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{comments}</span>
          </div>
        </div>
      </div>

      {/* Subject Tag */}
      <div className="px-5 py-3 border-t border-border">
        <span
          className="px-2.5 py-1 text-xs font-medium rounded-md border"
          style={{
            backgroundColor: `${subjectColor}10`,
            color: subjectColor,
            borderColor: `${subjectColor}30`,
          }}
        >
          {subject}
        </span>
      </div>
    </Card>
  );
}
