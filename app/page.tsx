"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Plus,
  User,
  Home, 
  CheckCircle2,
  BookOpen,
  Pin,
  Download,
  FileText,
  Presentation,
  Hash,
  Trash2,
  Clock,
  MapPin,
  UserPlus,
  Calendar,
  Link2,
  Users,
  Video,
  Timer,
  BookMarked,
  ExternalLink,
  X,
  Menu,
  CalendarPlus,
  CalendarDays,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { highlightText } from "@/lib/highlight";
import { useClientTime } from "@/lib/use-client-time";
import { downloadIcs, googleCalendarUrl, sanitizeFilename } from "@/lib/calendar";
import { QuestionCreator } from "@/components/forum/question-creator";
import { FilterTabs, type FilterType } from "@/components/forum/filter-tabs";
import { NotificationBell, type SessionSummary } from "@/components/forum/notification-bell";

// ============ TYPES ============
interface Question {
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
  isSolved: boolean;
  isVerified: boolean;
  views: number;
  replies: number;
  createdAt: number;
  description: string;
  codeBlocks: CodeBlock[];
  files: FileUpload[];
  videoUrl: string;
  isAnonymous: boolean;
  isMine: boolean;
  // Study Session fields
  isStudySession?: boolean;
  sessionDate?: string;
  sessionTime?: string;
  sessionLocation?: string;
  sessionLink?: string;
  sessionMaxParticipants?: number;
  sessionCurrentParticipants?: number;
  sessionMeetingType?: "in-person" | "online" | "hybrid";
}

interface Subject {
  code: string;
  name: string;
  color: string;
  shortCode: string;
}

interface PinnedFile {
  id: number;
  name: string;
  type: "pdf" | "docx" | "pptx";
  subject: string;
  size: string;
  tags: string[];
}

interface CodeBlock {
  id: string;
  language: string;
  code: string;
}

interface FileUpload {
  id: string;
  name: string;
  type: string;
  size: string;
  preview?: string;
}

// ============ CONSTANTS ============
const STUDY_SESSION_TAGS = ["#ติวก่อนสอบ", "#StudyGroup"];

// ============ DATA ============
const initialQuestions: Question[] = [
  // --- Study Session Posts ---
  {
    id: 9001,
    title: "📚 ITCS212 - ติวก่อนสอบ Data Structures: BST & Tree Traversal",
    tags: ["#ติวก่อนสอบ", "#StudyGroup", "Data Structures", "BST", "Tree"],
    description: "นัดติวข้อสอบ ITCS212 เนื้อหา Binary Search Tree, AVL Tree, และ Tree Traversal ทุกคนเตรียมโจทย์มาด้วยนะครับ จะมีสรุป cheat sheet ให้",
    author: { name: "Siriporn K.", initials: "SK", year: "Year 2", department: "Computer Science" },
    comments: 24,
    subject: "ITCS212",
    subjectColor: "#0891b2",
    isSolved: false,
    isVerified: false,
    views: 187,
    replies: 18,
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
    isStudySession: true,
    sessionDate: "2026-08-08",
    sessionTime: "14:00 - 17:00",
    sessionLocation: "ห้อง 101 ตึก Computer Lab",
    sessionLink: "https://meet.ict-mahidol.ac.th/bst-review",
    sessionMaxParticipants: 20,
    sessionCurrentParticipants: 14,
    sessionMeetingType: "in-person",
  },
  {
    id: 9002,
    title: "📚 ICCS340 - ติว SQL JOIN & Normalization ก่อนสอบ midterm",
    tags: ["#ติวก่อนสอบ", "#StudyGroup", "SQL", "Database", "JOIN"],
    description: "รวมตัวติว SQL ตั้งแต่ INNER JOIN จนถึง 3NF/BCNF มีแบบฝึกหัดเตรียมมาให้ทำกัน ใครมีโจทย์ยากๆ เอามาแชร์ได้เลย!",
    author: { name: "Thanawat P.", initials: "TP", year: "Year 3", department: "Computer Science" },
    comments: 18,
    subject: "ICCS340",
    subjectColor: "#c026d3",
    isSolved: false,
    isVerified: false,
    views: 142,
    replies: 12,
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
    isStudySession: true,
    sessionDate: "2026-08-07",
    sessionTime: "13:00 - 15:30",
    sessionLocation: "Zoom Meeting",
    sessionLink: "https://zoom.us/j/1234567890",
    sessionMaxParticipants: 30,
    sessionCurrentParticipants: 22,
    sessionMeetingType: "online",
  },
  {
    id: 9003,
    title: "📚 ITCS210 - ติว Java Exception Handling & OOP Concepts",
    tags: ["#ติวก่อนสอบ", "#StudyGroup", "Java", "OOP", "Exception"],
    description: "ติว Java สำหรับข้อสอบ midterm เนื้อหา try-catch, custom exceptions, และ OOP principles ที่จำเป็น ทุก level เข้าร่วมได้!",
    author: { name: "Nattapong S.", initials: "NS", year: "Year 1", department: "Computer Science" },
    comments: 15,
    subject: "ITCS210",
    subjectColor: "#7c3aed",
    isSolved: false,
    isVerified: false,
    views: 128,
    replies: 10,
    createdAt: Date.now() - 8 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
    isStudySession: true,
    sessionDate: "2026-08-06",
    sessionTime: "18:00 - 20:00",
    sessionLocation: "ห้อง 205 ตึก IT",
    sessionLink: "",
    sessionMaxParticipants: 15,
    sessionCurrentParticipants: 9,
    sessionMeetingType: "in-person",
  },
  {
    id: 9004,
    title: "📚 ITCS332 - ติว UML Diagram & System Design โค้งสุดท้าย",
    tags: ["#ติวก่อนสอบ", "#StudyGroup", "UML", "System Design"],
    description: "สรุปเนื้อหา UML ทั้ง Use Case, Class, Sequence, Activity Diagram พร้อมตัวอย่างโจทย์จริงจากข้อสอบปีก่อนๆ",
    author: { name: "Pornpimol C.", initials: "PC", year: "Year 3", department: "Computer Science" },
    comments: 21,
    subject: "ITCS332",
    subjectColor: "#dc2626",
    isSolved: false,
    isVerified: false,
    views: 203,
    replies: 15,
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
    isStudySession: true,
    sessionDate: "2026-08-09",
    sessionTime: "09:00 - 12:00",
    sessionLocation: "Hall A, Building 3",
    sessionLink: "",
    sessionMaxParticipants: 25,
    sessionCurrentParticipants: 19,
    sessionMeetingType: "in-person",
  },
  {
    id: 9005,
    title: "📚 ITCS371 - ติว Agile & Scrum สำหรับข้อสอบ final",
    tags: ["#ติวก่อนสอบ", "#StudyGroup", "Agile", "Scrum", "Project Management"],
    description: "ติว Agile Methodology, Scrum Framework, Sprint Planning ทั้ง theory และ practice มี quiz ทดสอบความเข้าใจให้ด้วย",
    author: { name: "Sarawut M.", initials: "SM", year: "Year 4", department: "Computer Science" },
    comments: 12,
    subject: "ITCS371",
    subjectColor: "#7c3aed",
    isSolved: false,
    isVerified: false,
    views: 95,
    replies: 8,
    createdAt: Date.now() - 6 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
    isStudySession: true,
    sessionDate: "2026-08-10",
    sessionTime: "14:00 - 16:00",
    sessionLocation: "Online (Google Meet)",
    sessionLink: "https://meet.google.com/abc-defg-hij",
    sessionMaxParticipants: 40,
    sessionCurrentParticipants: 28,
    sessionMeetingType: "online",
  },
  // --- Regular Posts ---
  {
    id: 1,
    title: "How to implement Binary Search Tree in Python?",
    tags: ["#Lab1", "Python", "Data Structures", "BST"],
    description: "I'm having trouble implementing a Binary Search Tree in Python.",
    author: { name: "Siriporn K.", initials: "SK", year: "Year 2", department: "Computer Science" },
    comments: 12,
    subject: "ITCS212",
    subjectColor: "#0891b2",
    isSolved: true,
    isVerified: true,
    views: 234,
    replies: 8,
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
  },
  {
    id: 2,
    title: "What's the difference between SQL JOIN types?",
    tags: ["#Assignment2", "SQL", "Database", "JOIN"],
    description: "I need to understand the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN.",
    author: { name: "Thanawat P.", initials: "TP", year: "Year 3", department: "Computer Science" },
    comments: 8,
    subject: "ICCS340",
    subjectColor: "#c026d3",
    isSolved: true,
    isVerified: true,
    views: 189,
    replies: 5,
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
  },
  {
    id: 3,
    title: "How to handle exceptions properly in Java?",
    tags: ["#Lab3", "Java", "Exception Handling", "OOP"],
    description: "I'm confused about when to use try-catch vs throws in Java.",
    author: { name: "Nattapong S.", initials: "NS", year: "Year 1", department: "Computer Science" },
    comments: 5,
    subject: "ITCS210",
    subjectColor: "#7c3aed",
    isSolved: false,
    isVerified: false,
    views: 87,
    replies: 3,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
  },
  {
    id: 4,
    title: "Best practices for drawing UML diagrams?",
    tags: ["#Assignment1", "UML", "System Design"],
    description: "What are the best practices for creating UML diagrams for system analysis?",
    author: { name: "Pornpimol C.", initials: "PC", year: "Year 3", department: "Computer Science" },
    comments: 15,
    subject: "ITCS332",
    subjectColor: "#dc2626",
    isSolved: true,
    isVerified: true,
    views: 312,
    replies: 10,
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
  },
  {
    id: 5,
    title: "Understanding recursion with factorial example",
    tags: ["#Lab2", "Recursion", "Algorithms", "Python"],
    description: "Can someone explain how recursion works with a factorial example?",
    author: { name: "Kittipat W.", initials: "KW", year: "Year 2", department: "Computer Science" },
    comments: 7,
    subject: "ITCS212",
    subjectColor: "#0891b2",
    isSolved: true,
    isVerified: false,
    views: 156,
    replies: 4,
    createdAt: Date.now() - 6 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
  },
  {
    id: 6,
    title: "How to normalize a database to 3NF?",
    tags: ["#Assignment3", "Database", "Normalization", "3NF"],
    description: "I need help understanding database normalization to Third Normal Form.",
    author: { name: "Supakorn T.", initials: "ST", year: "Year 3", department: "Computer Science" },
    comments: 10,
    subject: "ICCS340",
    subjectColor: "#c026d3",
    isSolved: false,
    isVerified: false,
    views: 98,
    replies: 6,
    createdAt: Date.now() - 12 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
  },
  {
    id: 7,
    title: "What is the Agile methodology in software development?",
    tags: ["#Lab4", "Agile", "Scrum", "Project Management"],
    description: "Can someone explain Agile methodology and how it differs from Waterfall?",
    author: { name: "Sarawut M.", initials: "SM", year: "Year 4", department: "Computer Science" },
    comments: 20,
    subject: "ITCS371",
    subjectColor: "#7c3aed",
    isSolved: true,
    isVerified: true,
    views: 402,
    replies: 12,
    createdAt: Date.now() - 4 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
  },
  {
    id: 8,
    title: "Difference between stack and queue data structures?",
    tags: ["#Lab1", "Stack", "Queue", "Data Structures"],
    description: "When should I use a stack vs a queue in my programs?",
    author: { name: "Apinya L.", initials: "AL", year: "Year 2", department: "Computer Science" },
    comments: 6,
    subject: "ITCS212",
    subjectColor: "#0891b2",
    isSolved: true,
    isVerified: true,
    views: 145,
    replies: 4,
    createdAt: Date.now() - 8 * 60 * 60 * 1000,
    isAnonymous: false,
    isMine: false,
    codeBlocks: [],
    files: [],
    videoUrl: "",
  },
];

const subjects: Subject[] = [
  { code: "ITCS210", name: "Fundamental Programming Concepts", color: "#7c3aed", shortCode: "ITCS" },
  { code: "ITCS212", name: "Data Structures", color: "#0891b2", shortCode: "ITCS" },
  { code: "ITCS332", name: "Information System Analysis and Design", color: "#dc2626", shortCode: "ITCS" },
  { code: "ICCS340", name: "Database Systems", color: "#c026d3", shortCode: "ICCS" },
  { code: "ITCS371", name: "Introduction to Software Engineering", color: "#7c3aed", shortCode: "ITCS" },
];

const pinnedFiles: PinnedFile[] = [
  { id: 1, name: "ITCS212 - BST Lecture Notes.pdf", type: "pdf", subject: "ITCS212", size: "2.4 MB", tags: ["Data Structures", "BST", "Python"] },
  { id: 2, name: "ITCS212 - Lab Assignment 1.pdf", type: "pdf", subject: "ITCS212", size: "1.1 MB", tags: ["#Lab1", "Data Structures"] },
  { id: 3, name: "ICCS340 - SQL JOIN Cheatsheet.docx", type: "docx", subject: "ICCS340", size: "890 KB", tags: ["SQL", "Database"] },
  { id: 4, name: "ITCS332 - UML Diagram Guide.pptx", type: "pptx", subject: "ITCS332", size: "5.6 MB", tags: ["UML", "System Design"] },
  { id: 5, name: "ITCS371 - Agile Methodology Slides.pptx", type: "pptx", subject: "ITCS371", size: "3.2 MB", tags: ["Agile", "Scrum", "Project Management"] },
  { id: 6, name: "ITCS210 - Java Exception Handling.pdf", type: "pdf", subject: "ITCS210", size: "1.8 MB", tags: ["Java", "Exception Handling"] },
];

const tagClouds = [
  "#Lab1", "#Lab2", "#Lab3", "#Lab4",
  "#Assignment1", "#Assignment2", "#Assignment3",
  "#ติวก่อนสอบ", "#StudyGroup",
  "Python", "Java", "SQL", "Database", "Data Structures",
  "OOP", "UML", "Agile", "BST", "Normalization",
];

// ============ HEADER COMPONENT ============
function Header({
  onCreatePost,
  searchQuery,
  onSearchChange,
  questions,
  selectedTags,
  onTagToggle,
  sessions,
  joinedIds,
  onOpenSidebar,
}: {
  onCreatePost: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  questions: Question[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  sessions: SessionSummary[];
  joinedIds: Set<number>;
  onOpenSidebar: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  // Close the suggestion panel when clicking outside / pressing Escape
  useEffect(() => {
    if (!focused) return;
    const handleClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [focused]);

  const q = searchQuery.trim().toLowerCase();

  const titleSuggestions = q
    ? questions.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 5)
    : [];

  const tagSuggestions = q
    ? tagClouds.filter((tag) => tag.toLowerCase().includes(q)).slice(0, 8)
    : [];

  const subjectSuggestions = q
    ? subjects
        .filter(
          (s) =>
            s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : [];

  const hasSuggestions =
    titleSuggestions.length > 0 ||
    tagSuggestions.length > 0 ||
    subjectSuggestions.length > 0;

  // Most-used tags shown as a quick Tag Cloud right under the search bar
  const quickTags = tagClouds.slice(0, 12);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="เปิดเมนูวิชาและคลังไฟล์"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/images/ict-logo.png" alt="ICT Mahidol University" className="h-10 w-auto object-contain" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">ICT Forum</h1>
            <p className="text-xs text-muted-foreground">Mahidol University</p>
          </div>
        </div>
        <div className="flex-1 max-w-2xl mx-4" ref={searchWrapRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for posts, subjects, or topics..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setFocused(true)}
              className="w-full pl-10 pr-9 bg-secondary/50 border-transparent focus-visible:border-input"
              aria-label="ค้นหากระทู้ วิชา หรือหัวข้อ"
              aria-expanded={focused}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="ล้างคำค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Keyword Search & Tag Cloud panel */}
            {focused && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                {hasSuggestions && (
                  <div className="max-h-72 overflow-y-auto">
                    {subjectSuggestions.length > 0 && (
                      <div className="px-3 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Subjects
                        </p>
                        {subjectSuggestions.map((s) => (
                          <button
                            key={s.code}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onSearchChange(s.code);
                              setFocused(false);
                            }}
                            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left hover:bg-secondary transition-colors"
                          >
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                              style={{ backgroundColor: s.color }}
                            >
                              {s.shortCode}
                            </span>
                            <span className="text-sm text-foreground">{s.code}</span>
                            <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {titleSuggestions.length > 0 && (
                      <div className="px-3 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Questions
                        </p>
                        {titleSuggestions.map((item) => (
                          <Link
                            key={item.id}
                            href={`/post/${item.id}`}
                            onClick={() => setFocused(false)}
                            className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors"
                          >
                            <Search className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <span className="text-sm text-foreground line-clamp-1">
                              {highlightText(item.title, searchQuery)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {tagSuggestions.length > 0 && (
                      <div className="px-3 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Matching tags
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {tagSuggestions.map((tag) => (
                            <button
                              key={tag}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                onTagToggle(tag);
                                onSearchChange("");
                                setFocused(false);
                              }}
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium transition-colors",
                                selectedTags.includes(tag)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tag Cloud — always available directly under the search bar */}
                <div className="px-3 py-3 border-t border-border bg-secondary/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Tag Cloud
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      const isStudyTag = STUDY_SESSION_TAGS.includes(tag);
                      return (
                        <button
                          key={tag}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onTagToggle(tag);
                          }}
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium transition-colors",
                            isSelected
                              ? isStudyTag
                                ? "bg-teal-600 text-white"
                                : "bg-primary text-primary-foreground"
                              : isStudyTag
                              ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onCreatePost} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">[+ New Post]</span>
          </Button>
          <NotificationBell sessions={sessions} joinedIds={joinedIds} />
          <Button variant="ghost" size="icon" aria-label="โปรไฟล์ผู้ใช้">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// ============ STUDY SESSION CARD COMPONENT ============
function StudySessionCard({
  question,
  onDelete,
  onTagToggle,
  joinedSessions,
  onJoinSession,
  searchQuery = "",
}: {
  question: Question;
  onDelete?: (id: number) => void;
  onTagToggle?: (tag: string) => void;
  joinedSessions: Set<number>;
  onJoinSession: (id: number) => void;
  searchQuery?: string;
}) {
  const {
    id, title, tags, description, author, comments, subject, subjectColor,
    isSolved, isVerified, views, replies, createdAt, isMine,
    sessionDate, sessionTime, sessionLocation, sessionLink,
    sessionMaxParticipants, sessionCurrentParticipants, sessionMeetingType,
  } = question;

  const isJoined = joinedSessions.has(id);
  const participants = (sessionCurrentParticipants || 0) + (isJoined ? 1 : 0);
  const maxParticipants = sessionMaxParticipants || 20;
  const isFull = participants >= maxParticipants;

  // Time-dependent values are computed only after mount so the server and the
  // client render the same markup (otherwise the clock ticks between the two
  // and React reports a hydration mismatch).
  const now = useClientTime();

  const timeAgo = (() => {
    if (now === null) return null;
    const diff = now - createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  })();

  const getTimeUntilSession = () => {
    if (!sessionDate || now === null) return null;
    const session = new Date(`${sessionDate}T${sessionTime?.split(" - ")[0] || "09:00"}:00`);
    const diff = session.getTime() - now;
    if (diff < 0) return { text: "Started", isUrgent: true, isPast: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return { text: `${days}d ${hours}h`, isUrgent: days <= 1, isPast: false };
    if (hours > 0) return { text: `${hours}h ${mins}m`, isUrgent: hours <= 3, isPast: false };
    return { text: `${mins}m`, isUrgent: true, isPast: false };
  };

  const sessionCountdown = getTimeUntilSession();

  const gcalUrl = googleCalendarUrl({
    title,
    description,
    location: sessionLocation,
    date: sessionDate,
    time: sessionTime,
    url: sessionLink,
  });

  const getMeetingIcon = () => {
    switch (sessionMeetingType) {
      case "online": return <Video className="w-3.5 h-3.5" />;
      case "hybrid": return <Users className="w-3.5 h-3.5" />;
      default: return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  const getMeetingLabel = () => {
    switch (sessionMeetingType) {
      case "online": return "Online";
      case "hybrid": return "Hybrid";
      default: return "In-person";
    }
  };

  // Parsed with an explicit time so it is read as local (not UTC) on both the
  // server and the client — a bare "2026-08-08" would shift a day across
  // timezones and break hydration.
  const formatDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Bangkok",
    });
  };

  return (
    <Link href={`/post/${id}`}>
    <Card className="p-0 gap-0 hover:shadow-lg transition-all duration-200 border-l-4 border-l-teal-500 cursor-pointer">
      <div className="p-5">
        {/* Study Session Header Badge */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full border border-teal-200">
            <BookOpen className="w-3.5 h-3.5" />
            📚 Study Session
          </span>
          <span className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full border border-border">
            {getMeetingIcon()} {getMeetingLabel()}
          </span>
          {isSolved && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
          {sessionCountdown && !sessionCountdown.isPast && (
            <span className={cn(
              "ml-auto px-2.5 py-1 rounded-full text-xs font-bold",
              sessionCountdown.isUrgent
                ? "bg-red-100 text-red-600 animate-pulse"
                : "bg-teal-100 text-teal-700"
            )}>
              <Timer className="w-3 h-3 inline mr-1" />
              {sessionCountdown.text}
            </span>
          )}
          {timeAgo && <span className="text-xs text-muted-foreground">{timeAgo}</span>}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight">
          {highlightText(title, searchQuery)}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {highlightText(description, searchQuery)}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagToggle?.(tag); }}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full border cursor-pointer hover:opacity-80 transition-opacity",
                STUDY_SESSION_TAGS.includes(tag)
                  ? "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200"
                  : tag.startsWith("#")
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              )}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Session Details Grid */}
        <div className="mb-4 p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-lg border border-teal-100 dark:border-teal-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-muted-foreground text-xs">Date</span>
                <p className="font-medium text-foreground">{sessionDate ? formatDate(sessionDate) : "TBD"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-muted-foreground text-xs">Time</span>
                <p className="font-medium text-foreground">{sessionTime || "TBD"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-muted-foreground text-xs">Location</span>
                <p className="font-medium text-foreground truncate" title={sessionLocation}>{sessionLocation || "TBD"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-muted-foreground text-xs">Participants</span>
                <p className="font-medium text-foreground">{participants}/{maxParticipants}</p>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="w-full bg-teal-100 dark:bg-teal-900 rounded-full h-1.5">
              <div
                className={cn("h-1.5 rounded-full transition-all", isFull ? "bg-red-500" : "bg-teal-500")}
                style={{ width: `${Math.min((participants / maxParticipants) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFull ? "Session full" : `${maxParticipants - participants} spots left`}
            </p>
          </div>
        </div>

        {/* Author & Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 bg-teal-500">
              <AvatarFallback className="bg-teal-500 text-white text-xs font-semibold">{author.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{author.name}</p>
              <p className="text-xs text-muted-foreground">{author.year} - {author.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sessionLink && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.preventDefault(); window.open(sessionLink, "_blank"); }}>
                <ExternalLink className="w-3.5 h-3.5" />
                Link
              </Button>
            )}
            {/* Save to calendar */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              title="บันทึกลงปฏิทิน (.ics)"
              aria-label="บันทึกลงปฏิทิน"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const ok = downloadIcs({
                  title,
                  description,
                  location: sessionLocation,
                  date: sessionDate,
                  time: sessionTime,
                  url: sessionLink,
                });
                if (ok) {
                  toast.success("บันทึกลงปฏิทินแล้ว", {
                    description: "ไฟล์ .ics ถูกดาวน์โหลด — เปิดเพื่อเพิ่มลงปฏิทินของคุณ",
                    action: gcalUrl
                      ? { label: "Google", onClick: () => window.open(gcalUrl, "_blank") }
                      : undefined,
                  });
                } else {
                  toast.error("บันทึกไม่สำเร็จ", { description: "กระทู้นี้ยังไม่ได้ระบุวันที่นัดติว" });
                }
              }}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ปฏิทิน</span>
            </Button>
            {isJoined ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onJoinSession(id); // triggers unjoin
                  toast.info("ยกเลิกการเข้าร่วมแล้ว", { description: `${title}` });
                }}
                className="gap-1.5 font-semibold border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Joined ✓
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={isFull}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onJoinSession(id); // triggers join
                  toast.success("เข้าร่วมสำเร็จ!", { description: `${title}` });
                }}
                className="gap-1.5 font-semibold bg-teal-600 hover:bg-teal-700 text-white"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Join Session
              </Button>
            )}
            {isMine && onDelete && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(id); }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Subject Badge */}
        <div className="px-5 py-3 border-t border-border mt-4 -mb-5">
          <span
            className="px-2.5 py-1 text-xs font-medium rounded-md border"
            style={{ backgroundColor: `${subjectColor}10`, color: subjectColor, borderColor: `${subjectColor}30` }}
          >
            {subject}
          </span>
        </div>
      </div>
    </Card>
    </Link>
  );
}

// ============ QUESTION CARD COMPONENT (Regular) ============
function QuestionCard({
  id, title, tags, description, author, comments, subject, subjectColor,
  isSolved = false, isVerified = false, views, replies, createdAt,
  isAnonymous = false, isMine = false, onDelete, onTagToggle, searchQuery = "",
}: Question & {
  onDelete?: (id: number) => void;
  onTagToggle?: (tag: string) => void;
  searchQuery?: string;
}) {
  // Computed after mount only — see StudySessionCard for why.
  const now = useClientTime();

  const timeAgo = (() => {
    if (now === null) return null;
    const diff = now - createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  })();

  return (
    <Link href={`/post/${id}`}>
      <Card className="p-0 gap-0 hover:shadow-md transition-shadow cursor-pointer">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            {isSolved && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Solved
              </span>
            )}
            {isVerified && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 text-cyan-600 text-xs font-medium rounded-full border border-cyan-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            )}
            {timeAgo && <span className="text-xs text-muted-foreground ml-auto">{timeAgo}</span>}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight">
            {highlightText(title, searchQuery)}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
              {highlightText(description, searchQuery)}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagToggle?.(tag); }}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full border cursor-pointer hover:opacity-80 transition-opacity",
                  tag.startsWith("#")
                    ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 bg-teal-500">
                <AvatarFallback className="bg-teal-500 text-white text-xs font-semibold">{author.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{author.name}</p>
                <p className="text-xs text-muted-foreground">{author.year} - {author.department}</p>
              </div>
            </div>
            {isMine && onDelete && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(id); }}
                className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete post"
                aria-label="ลบโพสต์"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="px-5 py-3 border-t border-border">
            <span
              className="px-2.5 py-1 text-xs font-medium rounded-md border"
              style={{ backgroundColor: `${subjectColor}10`, color: subjectColor, borderColor: `${subjectColor}30` }}
            >
              {subject}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ============ SIDEBAR COMPONENT ============
function Sidebar({
  selectedSubject, onSubjectChange, selectedTags, onTagToggle, pinnedFiles, onDownload,
}: {
  selectedSubject: string | null;
  onSubjectChange: (subject: string | null) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  pinnedFiles: PinnedFile[];
  onDownload: (file: PinnedFile) => void;
}) {
  return (
    <aside className="w-full space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-5 h-5" /> My Subjects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subjects.map((subject) => {
            const isSelected = selectedSubject === subject.code;
            return (
              <button
                key={subject.code}
                onClick={() => onSubjectChange(isSelected ? null : subject.code)}
                className={cn("flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all w-full text-left", isSelected ? "bg-primary/10 ring-2 ring-primary/30" : "hover:bg-secondary/50")}
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: subject.color }}>
                  {subject.shortCode}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{subject.code}</p>
                  <p className="text-xs text-muted-foreground truncate">{subject.name}</p>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
              </button>
            );
          })}
          {selectedSubject && (
            <button onClick={() => onSubjectChange(null)} className="flex items-center gap-2 w-full justify-center pt-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Clear Filter
            </button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="w-5 h-5" /> Tag Cloud
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-2">Filter by tags:</div>
          <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
            {tagClouds.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              const isStudyTag = STUDY_SESSION_TAGS.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onTagToggle(tag)}
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium transition-all",
                    isSelected
                      ? isStudyTag
                        ? "bg-teal-600 text-white"
                        : "bg-primary text-primary-foreground"
                      : isStudyTag
                      ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {selectedTags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Selected ({selectedTags.length}):</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onTagToggle(tag)}
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium transition-colors",
                      STUDY_SESSION_TAGS.includes(tag)
                        ? "bg-teal-100 text-teal-700 border border-teal-200"
                        : tag.startsWith("#")
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    )}
                  >
                    {tag} ✕
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Pin className="w-5 h-5" /> Pinned Academic Assets
            <span className="ml-auto text-xs font-normal text-muted-foreground">{pinnedFiles.length} files</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground mb-2">● No expiry</div>
          <div className="space-y-2">
            {pinnedFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No files found for this filter.</p>
            ) : (
              pinnedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                    {file.type === "pdf" && <FileText className="w-5 h-5 text-red-400" />}
                    {file.type === "docx" && <FileText className="w-5 h-5 text-blue-400" />}
                    {file.type === "pptx" && <Presentation className="w-5 h-5 text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size} • {file.subject}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onDownload(file)}
                    aria-label={`ดาวน์โหลด ${file.name}`}
                    title={`ดาวน์โหลด ${file.name}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

// ============ DOWNLOAD MODAL ============
/**
 * Builds a real, openable placeholder document for the pinned asset so the
 * [Download] button actually saves a file to the user's machine.
 */
function buildAssetBlob(file: PinnedFile): Blob {
  const header = [
    "ICT Community Forum — Mahidol University",
    "Pinned Academic Repository",
    "=========================================",
    "",
    `File      : ${file.name}`,
    `Subject   : ${file.subject}`,
    `Size      : ${file.size}`,
    `Tags      : ${file.tags.join(", ")}`,
    `Retention : No expiry — permanent academic asset`,
    `Downloaded: ${new Date().toLocaleString("th-TH")}`,
    "",
    "-----------------------------------------",
    "เอกสารประกอบการเรียนจากคลังความรู้ปักหมุด",
    "ไฟล์นี้ถูกจัดเก็บถาวร ไม่มีวันหมดอายุ",
    "-----------------------------------------",
  ].join("\n");

  return new Blob([header], { type: "text/plain;charset=utf-8" });
}

function triggerFileDownload(file: PinnedFile) {
  const blob = buildAssetBlob(file);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeFilename(file.name);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DownloadModal({ file, onClose }: { file: PinnedFile; onClose: () => void }) {
  const [status, setStatus] = useState<"downloading" | "success">("downloading");
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerFileDownload(file);
      setStatus("success");
      toast.success("ดาวน์โหลดสำเร็จ", { description: file.name });
    }, 1200);
    return () => clearTimeout(timer);
  }, [file]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        {status === "downloading" ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Download className="w-8 h-8 text-primary animate-bounce" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Downloading...</h3>
            <p className="text-sm text-muted-foreground mb-4">{file.name}</p>
            <div className="w-full bg-secondary rounded-full h-2 mb-2 overflow-hidden">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "100%" }} />
            </div>
            <p className="text-xs text-muted-foreground">{file.size}</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Download Complete!</h3>
            <p className="text-sm text-muted-foreground mb-4">{file.name}</p>
            <p className="text-xs text-emerald-600 font-medium mb-6">File saved successfully</p>
            <Button onClick={onClose} className="w-full">Back to Dashboard</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ MAIN PAGE COMPONENT ============
export default function ForumPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dynamicPinnedFiles, setDynamicPinnedFiles] = useState<PinnedFile[]>([]);
  const [downloadingFile, setDownloadingFile] = useState<PinnedFile | null>(null);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [joinedSessions, setJoinedSessions] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Panic Period Filter — narrows study sessions down to a date window
  const [sessionWindow, setSessionWindow] = useState<"all" | "week" | "today" | "date">("all");
  const [sessionDate, setSessionDate] = useState<string>("");

  // Load joined sessions from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("joinedSessions") || "[]");
      setJoinedSessions(new Set(stored));
    } catch {}
  }, []);

  // Support deep links from post pages: /?tag=%23Lab1 and /?q=keyword
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tag = params.get("tag");
    const q = params.get("q");
    const filter = params.get("filter");
    if (tag) setSelectedTags([tag]);
    if (q) setSearchQuery(q);
    if (filter === "study-session") setActiveFilter("study-session");
  }, []);

  // Save joined sessions to localStorage when changed
  useEffect(() => {
    if (joinedSessions.size > 0 || localStorage.getItem("joinedSessions")) {
      localStorage.setItem("joinedSessions", JSON.stringify([...joinedSessions]));
    }
  }, [joinedSessions]);

  // Load dynamic questions from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("dynamicQuestions") || "[]");
      const validStored = stored.filter((q: any) => q.id > 1000000000000);
      if (validStored.length !== stored.length) {
        localStorage.setItem("dynamicQuestions", JSON.stringify(validStored));
      }
      if (validStored.length > 0) {
        setQuestions((prev) => {
          const seen = new Set(prev.map((q) => q.id));
          const merged = [...prev];
          for (const q of validStored) {
            if (!seen.has(q.id)) {
              seen.add(q.id);
              merged.push(q);
            }
          }
          return merged;
        });
      }
    } catch {}
  }, []);

  const isStudySessionFilter = activeFilter === "study-session";

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handlePostCreated = (question: Question): number => {
    const newId = Date.now();
    const newQuestion = { ...question, id: newId };
    setQuestions((prev) => [newQuestion, ...prev]);
    const stored = JSON.parse(localStorage.getItem("dynamicQuestions") || "[]");
    stored.push(newQuestion);
    localStorage.setItem("dynamicQuestions", JSON.stringify(stored));
    const newFiles: PinnedFile[] = question.files.map((f, idx) => ({
      id: Date.now() + idx,
      name: f.name,
      type: f.type.includes("pdf") ? "pdf" : f.type.includes("docx") ? "docx" : "pptx",
      subject: question.subject,
      size: f.size,
      tags: question.tags,
    }));
    setDynamicPinnedFiles((prev) => [...newFiles, ...prev]);
    return newId;
  };

  const allPinnedFiles = [...dynamicPinnedFiles, ...pinnedFiles];

  const handleDeleteQuestion = (questionId: number) => {
    const stored = JSON.parse(localStorage.getItem("dynamicQuestions") || "[]");
    const updated = stored.filter((q: any) => q.id !== questionId);
    localStorage.setItem("dynamicQuestions", JSON.stringify(updated));
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setDeletingId(null);
    toast.success("โพสต์ถูกลบแล้ว");
  };

  const handleJoinSession = (sessionId: number) => {
    setJoinedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const filteredPinnedFiles = allPinnedFiles.filter((f) => {
    if (selectedSubject && f.subject !== selectedSubject) return false;
    if (selectedTags.length > 0 && !selectedTags.some((t) => f.tags.includes(t))) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = f.name.toLowerCase().includes(query);
      const matchesSubject = f.subject.toLowerCase().includes(query);
      const matchesTags = f.tags.some((t) => t.toLowerCase().includes(query));
      if (!matchesName && !matchesSubject && !matchesTags) return false;
    }
    return true;
  });

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (selectedSubject && q.subject !== selectedSubject) return false;
    if (selectedTags.length > 0 && !selectedTags.some((t) => q.tags.includes(t))) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = q.title.toLowerCase().includes(query);
      const matchesSubject = q.subject.toLowerCase().includes(query);
      const matchesTags = q.tags.some((t) => t.toLowerCase().includes(query));
      const matchesDescription = q.description?.toLowerCase().includes(query) || false;
      if (!matchesTitle && !matchesSubject && !matchesTags && !matchesDescription) return false;
    }

    // Study Session filter: only posts with study session tags
    if (isStudySessionFilter) {
      const hasStudySessionTag = q.tags.some(tag => STUDY_SESSION_TAGS.includes(tag));
      if (!hasStudySessionTag) return false;

      // Panic Period window — filter sessions by when they take place
      if (sessionWindow !== "all" && q.sessionDate) {
        const start = new Date(`${q.sessionDate}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (sessionWindow === "today") {
          if (start.getTime() !== today.getTime()) return false;
        } else if (sessionWindow === "week") {
          const weekAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (start < today || start > weekAhead) return false;
        } else if (sessionWindow === "date") {
          if (!sessionDate || q.sessionDate !== sessionDate) return false;
        }
      }
    }

    return true;
  });

  // Sort: study session posts first when in study session mode
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    if (isStudySessionFilter) {
      const aIsStudy = a.tags.some(tag => STUDY_SESSION_TAGS.includes(tag));
      const bIsStudy = b.tags.some(tag => STUDY_SESSION_TAGS.includes(tag));
      if (aIsStudy && !bIsStudy) return -1;
      if (!aIsStudy && bIsStudy) return 1;
    }
    return b.createdAt - a.createdAt;
  });

  // Separate study sessions and regular posts
  const studySessionQuestions = sortedQuestions.filter(q => q.tags.some(tag => STUDY_SESSION_TAGS.includes(tag)));
  const regularQuestions = sortedQuestions.filter(q => !q.tags.some(tag => STUDY_SESSION_TAGS.includes(tag)));

  // All study sessions (unfiltered) — used by the notification bell
  const allSessions: SessionSummary[] = questions
    .filter((q) => q.tags.some((tag) => STUDY_SESSION_TAGS.includes(tag)))
    .map((q) => ({
      id: q.id,
      title: q.title,
      subject: q.subject,
      sessionDate: q.sessionDate,
      sessionTime: q.sessionTime,
      sessionLocation: q.sessionLocation,
      sessionLink: q.sessionLink,
      description: q.description,
    }));

  const isSearching = searchQuery.trim().length > 0;
  const hasActiveFilters = isSearching || selectedTags.length > 0 || !!selectedSubject;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSelectedSubject(null);
  };

  return (
    <div className={cn(
      "min-h-screen bg-background transition-colors duration-500",
      isStudySessionFilter && "bg-gradient-to-b from-teal-50/80 via-background to-background dark:from-teal-950/20"
    )}>
      <Header
        onCreatePost={() => setIsModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        questions={questions}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        sessions={allSessions}
        joinedIds={joinedSessions}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-background overflow-y-auto p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-foreground">Filters & Assets</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                aria-label="ปิดเมนู"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <Sidebar
              selectedSubject={selectedSubject}
              onSubjectChange={(s) => { setSelectedSubject(s); setSidebarOpen(false); }}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              pinnedFiles={filteredPinnedFiles}
              onDownload={(f) => { setDownloadingFile(f); setSidebarOpen(false); }}
            />
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block lg:w-80 shrink-0">
            <Sidebar
              selectedSubject={selectedSubject}
              onSubjectChange={setSelectedSubject}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              pinnedFiles={filteredPinnedFiles}
              onDownload={setDownloadingFile}
            />
          </div>
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <button
                onClick={() => {
                  setActiveFilter("all");
                  setSelectedSubject(null);
                  setSelectedTags([]);
                  setSearchQuery("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex items-center gap-3 group flex-shrink-0"
              >
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-secondary group-hover:bg-primary/10 transition-colors">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">Home Feed</h2>
              </button>
              <div className="flex-1 flex justify-end min-w-0">
                <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />
              </div>
            </div>

            {/* Study Session Mode Banner */}
            {isStudySessionFilter && (
              <div className="mb-4 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-200 dark:border-teal-800 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5 text-teal-500" />
                  <span className="font-bold text-teal-600 dark:text-teal-400">📚 Study Session Mode</span>
                </div>
                <p className="text-sm text-teal-600/80 dark:text-teal-400/80 mb-3">
                  กำลังแสดงกระทู้นัดติวสอบ — หาเพื่อนติว ดูรายละเอียดแล้วกด Join ได้เลย!
                </p>

                {/* Panic Period window filter */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-teal-200/60 dark:border-teal-800/60">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-300">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    ช่วงเวลา:
                  </span>
                  {([
                    { id: "all", label: "ทั้งหมด" },
                    { id: "today", label: "วันนี้" },
                    { id: "week", label: "🔥 1 สัปดาห์ก่อนสอบ" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSessionWindow(opt.id);
                        setSessionDate("");
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        sessionWindow === opt.id
                          ? "bg-teal-600 text-white shadow-sm"
                          : "bg-white/70 dark:bg-gray-900/40 text-teal-700 dark:text-teal-300 hover:bg-white"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => {
                        setSessionDate(e.target.value);
                        setSessionWindow(e.target.value ? "date" : "all");
                      }}
                      className="h-7 px-2 rounded-md border border-teal-200 dark:border-teal-800 bg-white/70 dark:bg-gray-900/40 text-xs text-foreground"
                      aria-label="กรองตามวันที่นัดติว"
                    />
                    {sessionDate && (
                      <button
                        onClick={() => { setSessionDate(""); setSessionWindow("all"); }}
                        className="text-teal-700 hover:text-teal-900 dark:text-teal-300"
                        aria-label="ล้างวันที่"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Search results summary */}
            {hasActiveFilters && (
              <div className="mb-4 flex flex-wrap items-center gap-2 p-3 bg-secondary/50 border border-border rounded-xl">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">
                  พบ <strong>{sortedQuestions.length}</strong> กระทู้
                  {filteredPinnedFiles.length > 0 && (
                    <> · <strong>{filteredPinnedFiles.length}</strong> ไฟล์</>
                  )}
                  {isSearching && (
                    <> สำหรับ <span className="font-semibold text-primary">&ldquo;{searchQuery}&rdquo;</span></>
                  )}
                </span>
                {selectedSubject && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {selectedSubject}
                  </span>
                )}
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-colors"
                  >
                    {tag} ✕
                  </button>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="ml-auto text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Pinned Academic Repository — surfaced above the results while searching */}
            {hasActiveFilters && filteredPinnedFiles.length > 0 && (
              <Card className="mb-4 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Pin className="w-4 h-4" />
                    Pinned Academic Repository
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-medium">
                      ● No expiry
                    </span>
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {filteredPinnedFiles.length} ไฟล์ที่ตรงกัน
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredPinnedFiles.slice(0, 4).map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                          {file.type === "pdf" && <FileText className="w-5 h-5 text-red-400" />}
                          {file.type === "docx" && <FileText className="w-5 h-5 text-blue-400" />}
                          {file.type === "pptx" && <Presentation className="w-5 h-5 text-orange-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {highlightText(file.name, searchQuery)}
                          </p>
                          <p className="text-xs text-muted-foreground">{file.size} • {file.subject}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => setDownloadingFile(file)}
                          aria-label={`ดาวน์โหลด ${file.name}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {filteredPinnedFiles.length > 4 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      และอีก {filteredPinnedFiles.length - 4} ไฟล์ในคลังด้านซ้าย
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Content */}
            <div className="space-y-4">
              {isStudySessionFilter ? (
                <>
                  {/* Study Session Cards */}
                  {studySessionQuestions.length > 0 ? (
                    studySessionQuestions.map((question) => (
                      <StudySessionCard
                        key={question.id}
                        question={question}
                        onDelete={setDeletingId}
                        onTagToggle={handleTagToggle}
                        joinedSessions={joinedSessions}
                        onJoinSession={handleJoinSession}
                        searchQuery={searchQuery}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No study sessions found</h3>
                      <p className="text-muted-foreground">
                        {sessionWindow !== "all"
                          ? "ไม่มีนัดติวในช่วงเวลาที่เลือก — ลองเปลี่ยนช่วงเวลาดูครับ"
                          : "สร้างโพสต์นัดติวด้วยแท็ก #ติวก่อนสอบ หรือ #StudyGroup"}
                      </p>
                      {sessionWindow !== "all" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => { setSessionWindow("all"); setSessionDate(""); }}
                        >
                          ดูนัดติวทั้งหมด
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Regular posts below study sessions */}
                  {regularQuestions.length > 0 && (
                    <>
                      <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border">
                        <span className="text-sm font-medium text-muted-foreground">Other Posts</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      {regularQuestions.map((question) => (
                        <QuestionCard
                          key={question.id}
                          {...question}
                          onDelete={setDeletingId}
                          onTagToggle={handleTagToggle}
                          searchQuery={searchQuery}
                        />
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  {sortedQuestions.map((question) => {
                    const isStudySession = question.tags.some(tag => STUDY_SESSION_TAGS.includes(tag));
                    if (isStudySession) {
                      return (
                        <StudySessionCard
                          key={question.id}
                          question={question}
                          onDelete={setDeletingId}
                          onTagToggle={handleTagToggle}
                          joinedSessions={joinedSessions}
                          onJoinSession={handleJoinSession}
                          searchQuery={searchQuery}
                        />
                      );
                    }
                    return (
                      <QuestionCard
                        key={question.id}
                        {...question}
                        onDelete={setDeletingId}
                        onTagToggle={handleTagToggle}
                        searchQuery={searchQuery}
                      />
                    );
                  })}
                </>
              )}

              {sortedQuestions.length === 0 && !isStudySessionFilter && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {isSearching
                      ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}"`
                      : "No questions found for this filter."}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isSearching
                      ? "ลองใช้คำค้นอื่น หรือเลือกแท็กจาก Tag Cloud ด้านซ้าย"
                      : "Try adjusting your filters."}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={clearAllFilters}>
                        Clear all filters
                      </Button>
                    )}
                    <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-1.5">
                      <Plus className="w-4 h-4" />
                      ตั้งคำถามใหม่
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <QuestionCreator open={isModalOpen} onOpenChange={setIsModalOpen} onPostCreated={handlePostCreated} />

      {downloadingFile && (
        <DownloadModal file={downloadingFile} onClose={() => setDownloadingFile(null)} />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบโพสต์นี้?</AlertDialogTitle>
            <AlertDialogDescription>การดำเนินการนี้ไม่สามารถย้อนกลับได้ โพสต์นี้จะถูกลบออกอย่างถาวร</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDeleteQuestion(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบโพสต์
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
