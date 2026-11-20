"use client";

import { use, useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import * as D from "@/lib/data";
import { errMsg } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Flag } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  MoreHorizontal,
  Clock,
  Eye,
  Send,
  Reply,
  Shield,
  ChevronDown,
  ChevronRight,
  Code2,
  FileText,
  Video,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  BookOpen,
  Calendar,
  CalendarPlus,
  MapPin,
  Users,
  Timer,
  Link2,
  UserPlus,
  ExternalLink,
  Pencil,
  Award,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useTestContext } from "@/components/forum/test-context";
import { CodeBlock as CodeView, CodeEditor } from "@/components/forum/code-block";
import { downloadIcs, googleCalendarUrl, sessionCountdown } from "@/lib/calendar";
import { useVote, getStoredVote } from "@/lib/votes";
import { useClientTime } from "@/lib/use-client-time";

const languages = [
  "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#",
  "SQL", "HTML", "CSS", "PHP", "Ruby", "Go", "Rust", "Swift",
];

interface CodeBlock {
  id: string;
  language: string;
  code: string;
}

// ============ TYPES ============
interface NestedReply {
  id: number;
  content: string;
  author: {
    name: string;
    initials: string;
    year: string;
    department: string;
    role: "student" | "ta" | "instructor";
  };
  votes: number;
  createdAt: string;
  isMine?: boolean;
  replies?: NestedReply[];
}

interface Answer {
  id: number;
  content: string;
  author: {
    name: string;
    initials: string;
    year: string;
    department: string;
    role: "student" | "ta" | "instructor";
  };
  votes: number;
  isAccepted: boolean;
  isVerified: boolean;
  verifiedBy?: string;
  createdAt: string;
  isMine?: boolean;
  comments: NestedReply[];
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

interface Question {
  id: number;
  title: string;
  content: string;
  tags: string[];
  author: {
    name: string;
    initials: string;
    year: string;
    department: string;
  };
  votes: number;
  views: number;
  subject: string;
  subjectColor: string;
  isSolved: boolean;
  isVerified: boolean;
  createdAt: string;
  answers: Answer[];
  codeBlocks?: CodeBlock[];
  files?: FileUpload[];
  videoUrl?: string;
  isAnonymous?: boolean;
  isMine?: boolean;
  joined?: boolean;
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

// ============ RECOMMENDATION DATA ============
const recommendations: Record<string, { title: string; type: "slide" | "video" | "notes"; url: string; tag: string }[]> = {
  "Python": [
    { title: "Python Basics - Lecture Slides", type: "slide", url: "#", tag: "Python" },
    { title: "How to Fix Common Python Errors", type: "video", url: "#", tag: "Python" },
    { title: "Python Data Structures Cheat Sheet", type: "notes", url: "#", tag: "Data Structures" },
  ],
  "Data Structures": [
    { title: "BST & Tree Traversal Slides", type: "slide", url: "#", tag: "Data Structures" },
    { title: "Linked List vs Array Explained", type: "video", url: "#", tag: "Data Structures" },
    { title: "Algorithm Complexity Notes", type: "notes", url: "#", tag: "Algorithms" },
  ],
  "SQL": [
    { title: "SQL JOIN Types - Visual Guide", type: "slide", url: "#", tag: "SQL" },
    { title: "Database Normalization Tutorial", type: "video", url: "#", tag: "Normalization" },
    { title: "SQL Practice Exercises", type: "notes", url: "#", tag: "Database" },
  ],
  "Java": [
    { title: "Java OOP Concepts Slides", type: "slide", url: "#", tag: "Java" },
    { title: "Exception Handling Best Practices", type: "video", url: "#", tag: "Exception Handling" },
    { title: "Java Design Patterns Notes", type: "notes", url: "#", tag: "OOP" },
  ],
  "default": [
    { title: "ICT Forum - Getting Started Guide", type: "notes", url: "#", tag: "General" },
    { title: "How to Ask Good Questions", type: "video", url: "#", tag: "General" },
    { title: "Study Tips for Finals", type: "slide", url: "#", tag: "General" },
  ],
};

// ============ REPORT BUTTON ============
function ReportButton({ type, id, label = false }: { type: "question" | "answer" | "comment"; id: number; label?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (reason.trim().length < 3) return toast.error("กรุณาระบุเหตุผลอย่างน้อย 3 ตัวอักษร");
    setBusy(true);
    try {
      await D.reportContent(type, id, reason.trim());
      toast.success("ส่งรายงานแล้ว", { description: "ผู้ดูแลระบบจะตรวจสอบ" });
      setOpen(false); setReason("");
    } catch (e) { toast.error("ส่งรายงานไม่สำเร็จ", { description: errMsg(e) }); } finally { setBusy(false); }
  };
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors" title="รายงานเนื้อหาไม่เหมาะสม">
        <Flag className="w-3 h-3" />{label && "Report"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>รายงานเนื้อหาที่ไม่เหมาะสม</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เช่น ใช้คำหยาบ มีข้อมูลส่วนตัว เฉลยข้อสอบ" maxLength={500} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={submit} disabled={busy}>ส่งรายงาน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============ EDIT QUESTION ============
function EditQuestionDialog({ q, open, onOpenChange }: { q: Question; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [title, setTitle] = useState(q.title);
  const [body, setBody] = useState(q.content);
  const [tags, setTags] = useState(q.tags.join(", "));
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (title.trim().length < 5) return toast.error("หัวข้อต้องยาวอย่างน้อย 5 ตัวอักษร");
    setBusy(true);
    try {
      await D.updateQuestion(q.id, title.trim(), body, tags.split(",").map((t) => t.trim()).filter(Boolean));
      toast.success("แก้ไขกระทู้แล้ว");
      window.location.reload();
    } catch (e) { toast.error("แก้ไขไม่สำเร็จ", { description: errMsg(e) }); setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>แก้ไขกระทู้</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[140px]" />
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="แท็ก คั่นด้วยจุลภาค เช่น Java, #Lab1" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={save} disabled={busy}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ VOTE BUTTON COMPONENT ============
function VoteButton({
  direction,
  count,
  onVote,
  active = false,
}: {
  direction: "up" | "down";
  count?: number;
  onVote: () => void;
  /** controlled "already voted" state — persisted across reloads */
  active?: boolean;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleVote = () => {
    setIsAnimating(true);
    onVote();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleVote}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 transform",
          active
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/50 scale-110"
            : "bg-secondary hover:bg-secondary/80 text-muted-foreground hover:scale-105",
          isAnimating && "animate-pulse"
        )}
        title={direction === "up" ? "Upvote" : "Downvote"}
        aria-label={direction === "up" ? "โหวตขึ้น" : "โหวตลง"}
        aria-pressed={active}
      >
        {direction === "up" ? <ThumbsUp className="w-5 h-5" /> : <ThumbsDown className="w-5 h-5" />}
      </button>
      {count !== undefined && (
        <span className={cn(
          "text-lg font-bold text-foreground transition-all duration-300",
          isAnimating && "scale-125"
        )}>
          {count}
        </span>
      )}
    </div>
  );
}

// ============ COMMENT CONTENT RENDERER ============
/**
 * Renders comment/answer bodies: fenced code blocks get line numbers and
 * syntax colours, and attached screenshots render as real inline images.
 * Supported markers:
 *   ```lang ... ```            -> highlighted code block
 *   ![name](data:image/...)    -> inline image
 *   [Image: name]              -> legacy placeholder chip
 */
function CommentContent({ content, compact = true }: { content: string; compact?: boolean }) {
  const segments = content.split(/(```[\s\S]*?```|!\[[^\]]*\]\([^)]+\)|\[Image:[^\]]*\])/g);

  return (
    <>
      {segments.map((part, i) => {
        if (!part) return null;

        // Fenced code block
        if (part.startsWith("```")) {
          const langMatch = part.match(/^```(\w+)/);
          const language = langMatch ? langMatch[1] : "javascript";
          const code = part.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
          return (
            <div key={i} className="my-2">
              <CodeView language={language} code={code} compact={compact} />
            </div>
          );
        }

        // Inline image with a real source
        const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgMatch) {
          const [, alt, src] = imgMatch;
          return (
            <figure key={i} className="my-2 rounded-lg overflow-hidden border border-border bg-secondary/30 inline-block max-w-full">
              <a href={src} target="_blank" rel="noopener noreferrer">
                <img
                  src={src}
                  alt={alt || "attachment"}
                  className="max-h-72 w-auto max-w-full object-contain hover:opacity-90 transition-opacity"
                />
              </a>
              {alt && (
                <figcaption className="flex items-center gap-1.5 px-2 py-1 border-t border-border text-[11px] text-muted-foreground truncate">
                  <ImageIcon className="w-3 h-3 shrink-0" />
                  {alt}
                </figcaption>
              )}
            </figure>
          );
        }

        // Legacy placeholder
        if (part.startsWith("[Image:")) {
          return (
            <div key={i} className="my-2 flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{part}</span>
            </div>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/** Reads an image file and returns a markdown image marker with a data URL. */
function readImageAsMarker(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("ไฟล์ใหญ่เกิน 10MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(`\n![${file.name}](${e.target?.result})\n`);
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

// ============ NESTED REPLY COMPONENT ============
function NestedReply({
  reply,
  answerId,
  depth = 0,
}: {
  reply: NestedReply;
  answerId: number;
  depth?: number;
}) {
  const { session } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyCodeBlocks, setReplyCodeBlocks] = useState<CodeBlock[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [localReplies, setLocalReplies] = useState(reply.replies || []);
  const { votedUp, votedDown, offset, vote } = useVote(`reply:${reply.id}`);
  const replyCodeIdRef = useRef(0);

  // Editing own reply
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reply.content);
  const [content, setContent] = useState(reply.content);
  const [deleted, setDeleted] = useState(false);
  const isMine = !!reply.isMine;

  // Nested replies are re-ordered by score so the best clarification floats up
  const sortedReplies = [...localReplies].sort((a, b) => {
    const aScore = a.votes + getStoredVote(`reply:${a.id}`);
    const bScore = b.votes + getStoredVote(`reply:${b.id}`);
    if (bScore !== aScore) return bScore - aScore;
    return a.id - b.id;
  });

  const addReplyCodeBlock = () => {
    replyCodeIdRef.current += 1;
    setReplyCodeBlocks((prev) => [
      ...prev,
      { id: `rc-${replyCodeIdRef.current}`, language: "Python", code: "" },
    ]);
  };

  const removeReplyCodeBlock = (id: string) => {
    setReplyCodeBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateReplyCodeBlock = (id: string, field: "language" | "code", value: string) => {
    setReplyCodeBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleAddReply = async () => {
    if (!replyText.trim() && replyCodeBlocks.length === 0) return;
    const codeContent = replyCodeBlocks
      .map((b) => `\n\`\`\`${b.language.toLowerCase()}\n${b.code}\n\`\`\``)
      .join("");
    try {
      const newReply = await D.postComment(answerId, reply.id, replyText + codeContent, session!.user.id);
      setLocalReplies((prev) => [...prev, newReply]);
      setReplyText("");
      setReplyCodeBlocks([]);
      setShowReplyInput(false);
    } catch (e) { toast.error("ตอบกลับไม่สำเร็จ", { description: errMsg(e) }); }
  };

  const getRoleBadge = (role: string) => {
    if (role === "instructor") {
      return (
        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded border border-blue-200">
          INSTRUCTOR
        </span>
      );
    }
    if (role === "ta") {
      return (
        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded border border-purple-200">
          TA
        </span>
      );
    }
    return null;
  };

  if (deleted) {
    return (
      <div className={cn("relative", depth > 0 && "ml-6 mt-3")}>
        {depth > 0 && <div className="absolute left-0 top-0 bottom-0 w-px bg-primary/30" />}
        <div className={cn("py-2 text-xs italic text-muted-foreground", depth > 0 && "pl-4")}>
          คอมเมนต์นี้ถูกลบแล้ว
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", depth > 0 && "ml-6 mt-3")}>
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-primary/30" />
      )}
      <div className={cn("flex gap-3", depth > 0 && "pl-4")}>
        {/* Vote Section */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={() => vote(1)}
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center transition-all duration-200 transform",
              votedUp
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/50 scale-110"
                : "text-muted-foreground hover:bg-secondary hover:scale-105"
            )}
            title="Upvote"
            aria-label="โหวตขึ้น"
            aria-pressed={votedUp}
          >
            <ThumbsUp className="w-3 h-3" />
          </button>
          <span className={cn(
            "text-xs font-bold text-foreground transition-all duration-300",
            (votedUp || votedDown) && "scale-125"
          )}>
            {reply.votes + offset}
          </span>
          <button
            onClick={() => vote(-1)}
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center transition-all duration-200 transform",
              votedDown
                ? "bg-destructive text-destructive-foreground shadow-sm shadow-destructive/50 scale-110"
                : "text-muted-foreground hover:bg-secondary hover:scale-105"
            )}
            title="Downvote"
            aria-label="โหวตลง"
            aria-pressed={votedDown}
          >
            <ThumbsDown className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="w-6 h-6">
              <AvatarFallback className={cn(
                "text-[10px] font-semibold text-white",
                reply.author.role === "instructor" ? "bg-blue-500" :
                reply.author.role === "ta" ? "bg-purple-500" : "bg-teal-500"
              )}>
                {reply.author.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{reply.author.name}</span>
            {getRoleBadge(reply.author.role)}
            <span className="text-xs text-muted-foreground">• {reply.createdAt}</span>
          </div>

          {isEditing ? (
            <div className="mb-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] text-sm mb-2"
                aria-label="แก้ไขคอมเมนต์"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!editText.trim()) return;
                    try {
                      await D.editRow("comments", reply.id, editText);
                      setContent(editText);
                      setIsEditing(false);
                      toast.success("แก้ไขคอมเมนต์แล้ว");
                    } catch (e) { toast.error("แก้ไขไม่สำเร็จ", { description: errMsg(e) }); }
                  }}
                >
                  บันทึก
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditText(content); setIsEditing(false); }}
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground/80 mb-2 whitespace-pre-wrap">
              <CommentContent content={content} />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
            {!isMine && <ReportButton type="comment" id={reply.id} />}
            {isMine && !isEditing && (
              <>
                <button
                  onClick={() => { setEditText(content); setIsEditing(true); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={async () => { try { await D.softDelete("comments", reply.id); setDeleted(true); toast.success("ลบคอมเมนต์แล้ว"); } catch (e) { toast.error("ลบไม่สำเร็จ", { description: errMsg(e) }); } }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </>
            )}
            {localReplies && localReplies.length > 0 && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {localReplies.length} {localReplies.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="mt-3">
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={addReplyCodeBlock}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                  title="Add Code Block"
                >
                  <Code2 className="w-3 h-3" />
                  Add Code
                </button>
                <label className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-pointer">
                  <ImageIcon className="w-3 h-3" />
                  Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const marker = await readImageAsMarker(file);
                        setReplyText((prev) => prev + marker);
                      } catch (err) {
                        toast.error("แนบรูปไม่สำเร็จ", { description: (err as Error).message });
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px] text-sm mb-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddReply();
                  }
                }}
              />
              {replyCodeBlocks.map((block) => (
                <div key={block.id} className="border border-border rounded-lg overflow-hidden mb-2">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-green-400" />
                      <Select
                        value={block.language}
                        onValueChange={(v) => updateReplyCodeBlock(block.id, "language", v)}
                      >
                        <SelectTrigger className="w-32 h-6 text-xs bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-red-400"
                      onClick={() => removeReplyCodeBlock(block.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <CodeEditor
                    language={block.language}
                    value={block.code}
                    onChange={(v) => updateReplyCodeBlock(block.id, "code", v)}
                    placeholder={`Write ${block.language} code...`}
                    minHeight={80}
                  />
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Button
                  size="icon"
                  className="flex-shrink-0"
                  disabled={!replyText.trim() && replyCodeBlocks.length === 0}
                  onClick={handleAddReply}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {!collapsed && localReplies.length > 0 && (
            <div className="mt-2">
              {sortedReplies.map((r) => (
                <NestedReply key={r.id} reply={r} answerId={answerId} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ ANSWER CARD COMPONENT ============
function AnswerCard({
  answer,
  currentUserRole,
  onVerify,
  onAccept,
  canAccept = false,
}: {
  answer: Answer;
  currentUserRole: "student" | "ta" | "instructor";
  onVerify?: (answerId: number) => void;
  onAccept?: (answerId: number) => void;
  /** the post author can mark one answer as the accepted solution */
  canAccept?: boolean;
}) {
  const { session } = useAuth();
  const [answerContent, setAnswerContent] = useState(answer.content);
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [answerEdit, setAnswerEdit] = useState(answer.content);
  const [answerGone, setAnswerGone] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentCodeBlocks, setCommentCodeBlocks] = useState<CodeBlock[]>([]);
  const [localComments, setLocalComments] = useState(answer.comments);
  const { votedUp, votedDown, offset, vote } = useVote(`answer:${answer.id}`);
  const [visibleComments, setVisibleComments] = useState(5);
  const commentCodeIdRef = useRef(0);

  // Comments float up by score, matching the answer-level behaviour
  const sortedComments = [...localComments].sort((a, b) => {
    const aScore = a.votes + getStoredVote(`reply:${a.id}`);
    const bScore = b.votes + getStoredVote(`reply:${b.id}`);
    if (bScore !== aScore) return bScore - aScore;
    return a.id - b.id;
  });

  const addCommentCodeBlock = () => {
    commentCodeIdRef.current += 1;
    setCommentCodeBlocks((prev) => [
      ...prev,
      { id: `cc-${commentCodeIdRef.current}`, language: "Python", code: "" },
    ]);
  };

  const removeCommentCodeBlock = (id: string) => {
    setCommentCodeBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateCommentCodeBlock = (id: string, field: "language" | "code", value: string) => {
    setCommentCodeBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleAddComment = async () => {
    if (!commentText.trim() && commentCodeBlocks.length === 0) return;
    const codeContent = commentCodeBlocks
      .map((b) => `\n\`\`\`${b.language.toLowerCase()}\n${b.code}\n\`\`\``)
      .join("");
    try {
      const newComment = await D.postComment(answer.id, null, commentText + codeContent, session!.user.id);
      setLocalComments((prev) => [...prev, newComment]);
      setCommentText("");
      setCommentCodeBlocks([]);
    } catch (e) { toast.error("ส่งความคิดเห็นไม่สำเร็จ", { description: errMsg(e) }); }
  };

  const getRoleBadge = (role: string) => {
    if (role === "instructor") {
      return (
        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded border border-blue-200">
          INSTRUCTOR
        </span>
      );
    }
    if (role === "ta") {
      return (
        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded border border-purple-200">
          TA
        </span>
      );
    }
    return null;
  };

  if (answerGone) return <div className="py-3 text-sm italic text-muted-foreground">คำตอบนี้ถูกลบแล้ว</div>;

  // Instructor/TA can verify student answers (not their own, not already verified)
  const canVerify =
    (currentUserRole === "instructor" || currentUserRole === "ta") &&
    answer.author.role === "student" &&
    !answer.isVerified;

  return (
    <div className={cn(
      "border-l-4 pl-3 sm:pl-6 py-4",
      answer.isAccepted ? "border-emerald-500" : answer.isVerified ? "border-cyan-500" : "border-transparent"
    )}>
      <div className="flex gap-2 sm:gap-4">
        {/* Vote Section - On EVERY Answer Box */}
        <div className="flex flex-col items-center gap-2">
          <VoteButton
            direction="up"
            count={answer.votes + offset}
            onVote={() => vote(1)}
            active={votedUp}
          />
          <VoteButton
            direction="down"
            onVote={() => vote(-1)}
            active={votedDown}
          />
          {answer.isAccepted && (
            <div className="mt-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          )}
          {answer.isVerified && !answer.isAccepted && (
            <div className="mt-2">
              <CheckCircle2 className="w-8 h-8 text-cyan-500" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Top row: badges + owner/instructor actions */}
          <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Accepted Solution badge */}
              {answer.isAccepted && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">
                    ✓ Accepted Solution
                  </span>
                </div>
              )}

              {/* Verified Badge - Role-based RBAC */}
              {answer.isVerified && (
                <div className="flex items-center gap-2 p-2 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <Shield className="w-4 h-4 text-cyan-600" />
                  <span className="text-sm font-bold text-cyan-700">
                    ✓ Verified Answer
                  </span>
                  {answer.verifiedBy && (
                    <span className="text-xs text-cyan-600">
                      — endorsed by {answer.verifiedBy}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Post owner action: mark this answer as the solution */}
              {canAccept && onAccept && (
                <button
                  onClick={() => onAccept(answer.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors",
                    answer.isAccepted
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200"
                      : "bg-secondary text-muted-foreground border-border hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                  )}
                  title={answer.isAccepted ? "ยกเลิกการเลือกคำตอบนี้" : "เลือกเป็นคำตอบที่ถูกต้อง"}
                >
                  <Award className="w-3.5 h-3.5" />
                  {answer.isAccepted ? "Accepted ✓" : "Mark as Solution"}
                </button>
              )}

              {/* Instructor Action Component: Verify This Answer */}
              {canVerify && onVerify && (
                <button
                  onClick={() => onVerify(answer.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-300 hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verify This Answer
                </button>
              )}
            </div>
          </div>

          {/* Answer Content */}
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap mb-4">
            {editingAnswer ? (
              <div>
                <Textarea value={answerEdit} onChange={(e) => setAnswerEdit(e.target.value)} className="min-h-[100px] mb-2" aria-label="แก้ไขคำตอบ" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={async () => {
                    if (!answerEdit.trim()) return;
                    try { await D.editRow("answers", answer.id, answerEdit); setAnswerContent(answerEdit); setEditingAnswer(false); toast.success("แก้ไขคำตอบแล้ว"); }
                    catch (e) { toast.error("แก้ไขไม่สำเร็จ", { description: errMsg(e) }); }
                  }}>บันทึก</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAnswerEdit(answerContent); setEditingAnswer(false); }}>ยกเลิก</Button>
                </div>
              </div>
            ) : (
              <CommentContent content={answerContent} compact={false} />
            )}
          </div>

          {/* Author Info */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className={cn(
                  "text-xs font-semibold text-white",
                  answer.author.role === "instructor" ? "bg-blue-500" :
                  answer.author.role === "ta" ? "bg-purple-500" : "bg-teal-500"
                )}>
                  {answer.author.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{answer.author.name}</p>
                  {getRoleBadge(answer.author.role)}
                </div>
                <p className="text-xs text-muted-foreground">answered {answer.createdAt}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" aria-label="คัดลอกลิงก์" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("คัดลอกลิงก์แล้ว"); }}>
                <Share2 className="w-4 h-4" />
              </Button>
              {answer.isMine ? (
                <>
                  <Button variant="ghost" size="sm" aria-label="แก้ไขคำตอบ" onClick={() => { setAnswerEdit(answerContent); setEditingAnswer(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" aria-label="ลบคำตอบ" className="text-destructive" onClick={async () => {
                    try { await D.softDelete("answers", answer.id); setAnswerGone(true); toast.success("ลบคำตอบแล้ว"); }
                    catch (e) { toast.error("ลบไม่สำเร็จ", { description: errMsg(e) }); }
                  }}><Trash2 className="w-4 h-4" /></Button>
                </>
              ) : (
                <ReportButton type="answer" id={answer.id} label />
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <MessageCircle className="w-4 h-4" />
              {localComments.length} {localComments.length === 1 ? "comment" : "comments"}
              {showComments ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showComments && (
              <div className="space-y-3">
                {sortedComments.slice(0, visibleComments).map((comment) => (
                  <NestedReply key={comment.id} reply={comment} answerId={answer.id} />
                ))}

                {sortedComments.length > visibleComments && (
                  <button
                    onClick={() => setVisibleComments((n) => n + 5)}
                    className="flex items-center gap-1.5 w-full justify-center py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    ดูคอมเมนต์เพิ่มอีก {sortedComments.length - visibleComments} รายการ
                  </button>
                )}

                {visibleComments > 5 && sortedComments.length > 5 && (
                  <button
                    onClick={() => setVisibleComments(5)}
                    className="flex items-center gap-1.5 w-full justify-center py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    ย่อคอมเมนต์
                  </button>
                )}

                {/* Add Comment Input */}
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={addCommentCodeBlock}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                      title="Add Code Block"
                    >
                      <Code2 className="w-3 h-3" />
                      Add Code
                    </button>
                    <label className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-pointer">
                      <ImageIcon className="w-3 h-3" />
                      Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const marker = await readImageAsMarker(file);
                            setCommentText((prev) => prev + marker);
                          } catch (err) {
                            toast.error("แนบรูปไม่สำเร็จ", { description: (err as Error).message });
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[50px] text-sm mb-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  {commentCodeBlocks.map((block) => (
                    <div key={block.id} className="border border-border rounded-lg overflow-hidden mb-2">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-green-400" />
                          <Select
                            value={block.language}
                            onValueChange={(v) => updateCommentCodeBlock(block.id, "language", v)}
                          >
                            <SelectTrigger className="w-32 h-6 text-xs bg-gray-800 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-red-400"
                          onClick={() => removeCommentCodeBlock(block.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <CodeEditor
                        language={block.language}
                        value={block.code}
                        onChange={(v) => updateCommentCodeBlock(block.id, "code", v)}
                        placeholder={`Write ${block.language} code...`}
                        minHeight={80}
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="icon"
                      className="flex-shrink-0"
                      disabled={!commentText.trim() && commentCodeBlocks.length === 0}
                      onClick={handleAddComment}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN PAGE COMPONENT ============
export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { session } = useAuth();
  const [q, setQ] = useState<Question | null | undefined>(undefined);
  const [err, setErr] = useState("");
  const uid = session?.user.id;

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    const n = Number(id);
    if (!Number.isInteger(n)) { setQ(null); return; }
    D.loadPost(n, uid)
      .then((p) => { if (alive) { setQ(p as any); if (p) D.incrementView(n); } })
      .catch((e) => alive && setErr(errMsg(e)));
    return () => { alive = false; };
  }, [id, uid]);

  if (err) return <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center"><p className="text-destructive">{err}</p><Button onClick={() => window.location.reload()}>ลองใหม่</Button></div>;
  if (q === undefined) return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;
  if (q === null) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-bold">ไม่พบกระทู้นี้</h1>
      <p className="text-muted-foreground">กระทู้อาจถูกลบหรือไม่มีอยู่จริง</p>
      <Link href="/"><Button>กลับหน้าหลัก</Button></Link>
    </div>
  );
  return <PostDetail key={id} initial={q} id={id} />;
}

function PostDetail({ initial, id }: { initial: Question; id: string }) {
  const { currentRole } = useTestContext();
  const { session, profile, isAdmin, viewAs } = useAuth();
  const question = initial;
  const [pins, setPins] = useState<Record<string, boolean>>({});
  const canPin = currentRole === "ta" || currentRole === "instructor";
  const togglePin = async (fid: string, now: boolean) => {
    try {
      await D.pinFile(fid, !now);
      setPins((p) => ({ ...p, [fid]: !now }));
      toast.success(now ? "เลิกปักหมุดแล้ว" : "ปักหมุดไฟล์แล้ว", { description: now ? undefined : "ไฟล์จะแสดงใน Pinned Academic Repository" });
    } catch (e) { toast.error("ทำรายการไม่สำเร็จ", { description: errMsg(e) }); }
  };
  const [newAnswer, setNewAnswer] = useState("");
  const [answerCodeBlocks, setAnswerCodeBlocks] = useState<CodeBlock[]>([]);
  const {
    votedUp,
    votedDown,
    offset: questionVoteOffset,
    vote: voteQuestion,
  } = useVote(`question:${question.id}`);
  const [answers, setAnswers] = useState<Question["answers"]>(question.answers);
  const [isSolved, setIsSolved] = useState<boolean>(!!question.isSolved);
  const answerCodeIdRef = useRef(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  const [isJoined, setIsJoined] = useState(!!question.joined);
  const handleJoinSession = async (_sessionId: number) => {
    const was = isJoined;
    setIsJoined(!was);
    try { await D.joinSession(question.id, !was); }
    catch (e) { setIsJoined(was); toast.error(was ? "ยกเลิกไม่สำเร็จ" : "เข้าร่วมไม่สำเร็จ", { description: errMsg(e) }); }
  };
  const [bookmarked, setBookmarked] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  useEffect(() => {
    if (session) D.isBookmarked(session.user.id, question.id).then(setBookmarked).catch(() => {});
  }, [session, question.id]);
  const toggleBookmark = async () => {
    const next = !bookmarked;
    setBookmarked(next);
    try { await D.setBookmark(session!.user.id, question.id, next); toast.success(next ? "บันทึกกระทู้แล้ว" : "ยกเลิกการบันทึกแล้ว"); }
    catch (e) { setBookmarked(!next); toast.error(errMsg(e)); }
  };
  const copyLink = () => { navigator.clipboard?.writeText(window.location.href); toast.success("คัดลอกลิงก์แล้ว"); };
  const canDeletePost = question.isMine || (isAdmin && viewAs === "admin");


  /* ---------- Study session derived values ---------- */
  const sessionMax = question.sessionMaxParticipants || 20;
  // Reflect the user's own join immediately, matching the feed card behaviour
  const sessionParticipants =
    (question.sessionCurrentParticipants || 0) + (isJoined ? 1 : 0);
  const sessionIsFull = sessionParticipants >= sessionMax;

  // Live countdown — null until mounted so SSR and client markup match,
  // then refreshed every minute by the hook.
  const now = useClientTime();

  const sessionTimer =
    question.isStudySession && now !== null
      ? sessionCountdown(question.sessionDate, question.sessionTime)
      : null;

  const sessionEvent = {
    title: question.title,
    description: question.content,
    location: question.sessionLocation,
    date: question.sessionDate,
    time: question.sessionTime,
    url: question.sessionLink,
  };

  const sessionGcalUrl = question.isStudySession ? googleCalendarUrl(sessionEvent) : null;

  const handleSaveToCalendar = () => {
    const ok = downloadIcs(sessionEvent);
    if (ok) {
      toast.success("บันทึกลงปฏิทินแล้ว", {
        description: "ไฟล์ .ics ถูกดาวน์โหลด — เปิดเพื่อเพิ่มลงปฏิทินของคุณ",
        action: sessionGcalUrl
          ? { label: "Google", onClick: () => window.open(sessionGcalUrl, "_blank") }
          : undefined,
      });
    } else {
      toast.error("บันทึกไม่สำเร็จ", { description: "กระทู้นี้ยังไม่ได้ระบุวันที่นัดติว" });
    }
  };

  const handleDeletePost = async () => {
    try {
      await D.deleteQuestion(Number(id));
      toast.success("โพสต์ถูกลบแล้ว");
      window.location.href = "/";
    } catch (e) { toast.error("ลบไม่สำเร็จ", { description: errMsg(e) }); }
  };

  const addAnswerCodeBlock = () => {
    answerCodeIdRef.current += 1;
    setAnswerCodeBlocks((prev) => [
      ...prev,
      { id: `ac-${answerCodeIdRef.current}`, language: "Python", code: "" },
    ]);
  };

  const removeAnswerCodeBlock = (id: string) => {
    setAnswerCodeBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateAnswerCodeBlock = (id: string, field: "language" | "code", value: string) => {
    setAnswerCodeBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim() && answerCodeBlocks.length === 0) {
      toast.error("Empty answer", {
        description: "Please write something or add a code block.",
      });
      return;
    }

    setIsSubmittingAnswer(true);
    try {
      const codeContent = answerCodeBlocks
        .map((b) => `\n\`\`\`${b.language.toLowerCase()}\n${b.code}\n\`\`\``)
        .join("");
      const answer = await D.postAnswer(question.id, newAnswer + codeContent, session!.user.id);
      setAnswers((prev) => [answer as any, ...prev]);
      setNewAnswer("");
      setAnswerCodeBlocks([]);
      toast.success("Answer posted!", { description: "Your solution has been shared with the community." });
    } catch (error) {
      toast.error("Failed to post answer", { description: errMsg(error) });
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleVerify = async (answerId: number) => {
    try {
      await D.verifyAnswer(answerId);
      setAnswers((prev) => prev.map((a) => a.id === answerId ? { ...a, isVerified: true, verifiedBy: profile?.display_name ?? "TA" } : a));
      toast.success("ยืนยันคำตอบแล้ว");
    } catch (e) { toast.error("ยืนยันไม่สำเร็จ", { description: errMsg(e) }); }
  };

  /** The post author picks the answer that actually solved the problem. */
  const handleAccept = async (answerId: number) => {
    try { await D.acceptAnswer(answerId); } catch (e) { toast.error("ทำรายการไม่สำเร็จ", { description: errMsg(e) }); return; }
    let nowAccepted = false;
    setAnswers((prev) =>
      prev.map((a) => {
        if (a.id === answerId) {
          nowAccepted = !a.isAccepted;
          return { ...a, isAccepted: nowAccepted };
        }
        // only one accepted answer at a time
        return a.isAccepted ? { ...a, isAccepted: false } : a;
      })
    );
    setIsSolved(nowAccepted);
    toast.success(
      nowAccepted ? "ทำเครื่องหมายเป็นคำตอบที่ถูกต้องแล้ว" : "ยกเลิกคำตอบที่ถูกต้องแล้ว",
      {
        description: nowAccepted
          ? "กระทู้นี้จะถูกแสดงเป็น Solved ให้คนอื่นเห็น"
          : undefined,
      }
    );
  };

  // The asker (or an instructor) may accept a solution
  const canAcceptAnswers = question.isMine || currentRole === "instructor";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Question</h1>
            <p className="text-xs text-muted-foreground">{question.subject}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="บันทึกกระทู้" onClick={toggleBookmark}>
            <Bookmark className={cn("w-5 h-5", bookmarked && "fill-current text-primary")} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="คัดลอกลิงก์" onClick={copyLink}>
            <Share2 className="w-5 h-5" />
          </Button>
          {question.isMine && (
            <Button variant="ghost" size="icon" aria-label="แก้ไขกระทู้" onClick={() => setEditOpen(true)}>
              <Pencil className="w-5 h-5" />
            </Button>
          )}
          {!question.isMine && <ReportButton type="question" id={question.id} label />}
          {canDeletePost && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      <EditQuestionDialog q={question} open={editOpen} onOpenChange={setEditOpen} />
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบกระทู้นี้</AlertDialogTitle>
            <AlertDialogDescription>
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ กระทู้นี้จะถูกลบออกอย่างถาวร
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบกระทู้
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="container mx-auto px-4 py-6 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0 max-w-4xl">
        {/* Question Card */}
        <Card className={cn("p-6 mb-6", question.isStudySession && "border-l-4 border-l-teal-500")}>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {question.isStudySession && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full border border-teal-200">
                <BookOpen className="w-3.5 h-3.5" />
                📚 Study Session
              </span>
            )}
            {isSolved && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Solved
              </span>
            )}
            {question.isVerified && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 text-cyan-600 text-xs font-medium rounded-full border border-cyan-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
            <span
              className="px-2.5 py-1 text-xs font-medium rounded-md border"
              style={{
                backgroundColor: `${question.subjectColor}10`,
                color: question.subjectColor,
                borderColor: `${question.subjectColor}30`,
              }}
            >
              {question.subject}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-4">{question.title}</h1>

          {/* Study Session Details Card */}
          {question.isStudySession && (
            <div className="mb-6 p-5 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-xl border border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-teal-700 dark:text-teal-300">รายละเอียดการนัดติว</h3>
                {sessionTimer && !sessionTimer.isPast && (
                  <span
                    className={cn(
                      "ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                      sessionTimer.isUrgent
                        ? "bg-red-100 text-red-600 animate-pulse"
                        : "bg-teal-100 text-teal-700"
                    )}
                  >
                    <Timer className="w-3 h-3" />
                    อีก {sessionTimer.text}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">วันที่</p>
                    <p className="font-semibold text-foreground">{question.sessionDate || "TBD"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">เวลา</p>
                    <p className="font-semibold text-foreground">{question.sessionTime || "TBD"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">สถานที่</p>
                    <p className="font-semibold text-foreground">{question.sessionLocation || "TBD"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">ผู้เข้าร่วม</p>
                    <p className="font-semibold text-foreground">{sessionParticipants}/{sessionMax}</p>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mb-4">
                <div className="w-full bg-teal-100 dark:bg-teal-900 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      sessionIsFull ? "bg-red-500" : "bg-teal-500"
                    )}
                    style={{ width: `${Math.min((sessionParticipants / sessionMax) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {sessionIsFull ? "Session full" : `${sessionMax - sessionParticipants} spots left`}
                </p>
              </div>
              {/* Meeting Link */}
              {question.sessionLink && (
                <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-teal-100 dark:border-teal-900">
                  <Link2 className="w-4 h-4 text-teal-600" />
                  <span className="text-sm text-muted-foreground">Meeting:</span>
                  <a href={question.sessionLink} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:underline font-medium truncate">{question.sessionLink}</a>
                </div>
              )}
              {/* Join Button */}
              <div className="mt-4 flex gap-3 flex-wrap">
                {isJoined ? (
                  <Button
                    variant="outline"
                    className="gap-2 font-semibold border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    onClick={() => {
                      handleJoinSession(question.id);
                      toast.info("ยกเลิกการเข้าร่วมแล้ว", { description: question.title });
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Joined ✓
                  </Button>
                ) : (
                  <Button
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-2 font-semibold"
                    disabled={sessionIsFull}
                    onClick={() => {
                      handleJoinSession(question.id);
                      toast.success("เข้าร่วมสำเร็จ!", {
                        description: question.title,
                        action: {
                          label: "บันทึกปฏิทิน",
                          onClick: () => handleSaveToCalendar(),
                        },
                      });
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                    Join Session
                  </Button>
                )}

                {/* Save to calendar */}
                <Button variant="outline" className="gap-2" onClick={handleSaveToCalendar}>
                  <CalendarPlus className="w-4 h-4" />
                  บันทึกปฏิทิน
                </Button>

                {sessionGcalUrl && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(sessionGcalUrl, "_blank")}
                  >
                    <Calendar className="w-4 h-4" />
                    Google Calendar
                  </Button>
                )}

                {question.sessionLink && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(question.sessionLink, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    เปิดลิงก์
                  </Button>
                )}
              </div>

              {/* Reminder notice once joined */}
              {isJoined && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-white/60 dark:bg-gray-900/40 border border-teal-100 dark:border-teal-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    คุณเข้าร่วมนัดติวนี้แล้ว — ดูรายการนัดทั้งหมดได้ที่ไอคอนกระดิ่ง 🔔 บนหน้าแรก
                    ระบบจะเตือนเมื่อเหลือเวลาน้อยกว่า 24 ชั่วโมง
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Asked {question.createdAt}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {question.views} views
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {answers.length} answers
            </span>
          </div>

          <div className="flex gap-6">
            {/* Vote Section */}
            <div className="flex flex-col items-center gap-2">
              <VoteButton
                direction="up"
                count={question.votes + questionVoteOffset}
                onVote={() => voteQuestion(1)}
                active={votedUp}
              />
              <VoteButton
                direction="down"
                onVote={() => voteQuestion(-1)}
                active={votedDown}
              />
              <Button variant="ghost" size="icon" className="mt-2" aria-label="บันทึกกระทู้" onClick={toggleBookmark}>
                <Bookmark className={cn("w-5 h-5", bookmarked && "fill-current text-primary")} />
              </Button>
            </div>

            {/* Content Section */}
            <div className="flex-1">
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap mb-6">
                {question.content}
              </div>

              {/* Code Blocks — line numbers + syntax colours + copy */}
              {question.codeBlocks && question.codeBlocks.length > 0 && (
                <div className="space-y-4 mb-6">
                  {question.codeBlocks.map((block: CodeBlock) => (
                    <CodeView key={block.id} language={block.language} code={block.code} />
                  ))}
                </div>
              )}

              {/* Attachments — error screenshots render inline */}
              {question.files && question.files.length > 0 && (
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium text-foreground">Attachments</p>

                  {/* Images */}
                  {question.files.some((f: FileUpload) => f.preview) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {question.files
                        .filter((f: FileUpload) => f.preview)
                        .map((file: FileUpload) => (
                          <figure
                            key={file.id}
                            className="rounded-lg overflow-hidden border border-border bg-secondary/30"
                          >
                            <a href={file.preview} target="_blank" rel="noopener noreferrer">
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="w-full max-h-80 object-contain bg-gray-950/5 hover:opacity-90 transition-opacity"
                              />
                            </a>
                            <figcaption className="flex items-center gap-2 px-3 py-2 border-t border-border">
                              <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs text-foreground truncate">{file.name}</span>
                              <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
                                {file.size}
                              </span>
                            </figcaption>
                          </figure>
                        ))}
                    </div>
                  )}

                  {/* Non-image files */}
                  {question.files.some((f: FileUpload) => !f.preview) && (
                    <div className="flex flex-wrap gap-2">
                      {question.files
                        .filter((f: FileUpload) => !f.preview)
                        .map((file: FileUpload) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg border border-border"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{file.name}</span>
                            <span className="text-xs text-muted-foreground">({file.size})</span>
                            {(file as any).url && <a href={(file as any).url} download={file.name} className="text-xs text-primary underline ml-1">ดาวน์โหลด</a>}
                            {canPin && (() => { const on = pins[file.id] ?? !!(file as any).pinned; return <button type="button" onClick={() => togglePin(String(file.id), on)} className="text-xs underline ml-1 text-amber-600">{on ? "เลิกปักหมุด" : "ปักหมุด"}</button>; })()}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Video Link */}
              {question.videoUrl && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-foreground mb-2">Video Reference</p>
                  <a
                    href={question.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:underline"
                  >
                    <Video className="w-4 h-4" />
                    {question.videoUrl}
                  </a>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-6">
                {question.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/?tag=${encodeURIComponent(tag)}`}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
                      ["#ติวก่อนสอบ", "#StudyGroup"].includes(tag)
                        ? "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200"
                        : tag.startsWith("#")
                        ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                        : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    )}
                    title={`ดูกระทู้ทั้งหมดที่มีแท็ก ${tag}`}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 bg-teal-500">
                    <AvatarFallback className="bg-teal-500 text-white text-sm font-semibold">
                      {question.author.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{question.author.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {question.author.year} - {question.author.department}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Answers Section */}
        <div className="mb-32">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h2 className="text-xl font-bold text-foreground">
              {answers.length} Answers
            </h2>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
              <Award className="w-3.5 h-3.5" />
              เรียงตาม: คำตอบที่ถูกเลือก → Verified → คะแนนโหวต
            </span>
          </div>
          <div className="space-y-6">
            {[...answers]
              .sort((a, b) => {
                if (a.isAccepted && !b.isAccepted) return -1;
                if (!a.isAccepted && b.isAccepted) return 1;
                if (a.isVerified && !b.isVerified) return -1;
                if (!a.isVerified && b.isVerified) return 1;
                const aScore = a.votes + getStoredVote(`answer:${a.id}`);
                const bScore = b.votes + getStoredVote(`answer:${b.id}`);
                return bScore - aScore;
              })
              .map((answer) => (
                <Card key={answer.id} className="p-4">
                  <AnswerCard
                    answer={answer}
                    currentUserRole={currentRole}
                    onVerify={handleVerify}
                    onAccept={handleAccept}
                    canAccept={canAcceptAnswers}
                  />
                </Card>
              ))}
            {answers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No answers yet. Be the first to help!</p>
              </div>
            )}
          </div>
        </div>

        </div>{/* end main content */}

        {/* Sticky Primary Solution Input Box */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
          <div className="container mx-auto px-4 py-4 lg:px-6 max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="text-sm font-bold text-foreground mb-1.5 block">
                  Post Solution
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={addAnswerCodeBlock}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                    title="Add Code Block"
                  >
                    <Code2 className="w-3 h-3" />
                    Add Code
                  </button>
                  <label className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-pointer">
                    <ImageIcon className="w-3 h-3" />
                    Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const marker = await readImageAsMarker(file);
                          setNewAnswer((prev) => prev + marker);
                        } catch (err) {
                          toast.error("แนบรูปไม่สำเร็จ", { description: (err as Error).message });
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <Textarea
                  ref={answerInputRef}
                  placeholder="Write your answer here... Share your knowledge to help others! (Tip: Cmd+Enter to submit)"
                  className="min-h-[60px] max-h-[120px] text-sm mb-2"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isSubmittingAnswer) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  aria-label="Answer text"
                />
                {answerCodeBlocks.map((block) => (
                  <div key={block.id} className="border border-border rounded-lg overflow-hidden mb-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-green-400" />
                        <Select
                          value={block.language}
                          onValueChange={(v) => updateAnswerCodeBlock(block.id, "language", v)}
                        >
                          <SelectTrigger className="w-32 h-6 text-xs bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-red-400"
                        onClick={() => removeAnswerCodeBlock(block.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <CodeEditor
                      language={block.language}
                      value={block.code}
                      onChange={(v) => updateAnswerCodeBlock(block.id, "code", v)}
                      placeholder={`Write ${block.language} code...`}
                      minHeight={80}
                    />
                  </div>
                ))}
              </div>
              <Button
                className="mt-6 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                disabled={(!newAnswer.trim() && answerCodeBlocks.length === 0) || isSubmittingAnswer}
                onClick={handleSubmitAnswer}
              >
                {isSubmittingAnswer ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Solution
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Recommendation Widget Sidebar */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Recommended for you</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                ตัวอย่างข้อมูล (Demo) — ระบบแนะนำเนื้อหาจริงเป็น Future Work
              </p>
              <div className="space-y-3">
                {(recommendations[question.tags[0]] || recommendations["default"]).map((rec, i) => (
                  <a
                    key={i}
                    href={rec.url}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors group"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      rec.type === "slide" ? "bg-blue-100 text-blue-600" :
                      rec.type === "video" ? "bg-red-100 text-red-600" :
                      "bg-emerald-100 text-emerald-600"
                    )}>
                      {rec.type === "slide" ? <FileText className="w-4 h-4" /> :
                       rec.type === "video" ? <Video className="w-4 h-4" /> :
                       <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {rec.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        #{rec.tag}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          </div>
        </aside>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบโพสต์นี้?</AlertDialogTitle>
            <AlertDialogDescription>
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ โพสต์นี้จะถูกลบออกอย่างถาวร
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
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
