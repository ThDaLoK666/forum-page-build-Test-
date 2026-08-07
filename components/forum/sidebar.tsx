"use client";

import { BookOpen, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Subject {
  code: string;
  name: string;
  color: string;
  shortCode: string;
}

const subjects: Subject[] = [
  {
    code: "ITCS210",
    name: "Fundamental Programming Concepts",
    color: "#7c3aed",
    shortCode: "ITCS",
  },
  {
    code: "ITCS212",
    name: "Data Structures",
    color: "#0891b2",
    shortCode: "ITCS",
  },
  {
    code: "ITCS332",
    name: "Information System Analysis and Design",
    color: "#dc2626",
    shortCode: "ITCS",
  },
  {
    code: "ICCS340",
    name: "Database Systems",
    color: "#c026d3",
    shortCode: "ICCS",
  },
  {
    code: "ITCS371",
    name: "Introduction to Software Engineering",
    color: "#7c3aed",
    shortCode: "ITCS",
  },
];

export function Sidebar() {
  return (
    <aside className="w-full lg:w-80 space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-5 h-5" />
            My Subjects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subjects.map((subject) => (
            <div
              key={subject.code}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: subject.color }}
              >
                {subject.shortCode}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {subject.code}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {subject.name}
                </p>
              </div>
            </div>
          ))}

          <button className="flex items-center gap-2 w-full justify-center pt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            View All Subjects
            <ArrowRight className="w-4 h-4" />
          </button>
        </CardContent>
      </Card>
    </aside>
  );
}
