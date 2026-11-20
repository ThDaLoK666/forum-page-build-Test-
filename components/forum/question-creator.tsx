"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Code2,
  Upload,
  FileText,
  Video,
  Eye,
  Shield,
  Send,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTestContext } from "./test-context";
import { errMsg } from "@/lib/supabase";
import { CodeBlock, CodeEditor } from "./code-block";

const tagClouds = [
  "#Lab1", "#Lab2", "#Lab3", "#Lab4", "#Assignment1", "#Assignment2", "#Assignment3",
  "Python", "Java", "SQL", "JavaScript", "TypeScript", "C", "C++", "C#", "HTML", "CSS",
  "PHP", "Ruby", "Go", "Rust", "Swift", "OOP", "Data Structures", "Database", "Normalization",
  "Project Management", "Agile", "Exception Handling", "System Design", "Scrum",
];

const studySessionTags = ["#ติวก่อนสอบ", "#StudyGroup"];

interface CodeBlock {
  id: string;
  language: string;
  code: string;
}

interface FileUpload {
  file?: File;
  id: string;
  name: string;
  type: string;
  size: string;
  preview?: string;
}

interface Question {
  id: number;
  title: string;
  tags: string[];
  description: string;
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
  codeBlocks: CodeBlock[];
  files: FileUpload[];
  videoUrl: string;
  isAnonymous: boolean;
  isMine: boolean;
  isStudySession?: boolean;
  sessionDate?: string;
  sessionTime?: string;
  sessionLocation?: string;
  sessionLink?: string;
  sessionMaxParticipants?: number;
  sessionCurrentParticipants?: number;
  sessionMeetingType?: "in-person" | "online" | "hybrid";
}

interface QuestionCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: (question: Question) => Promise<number>;
}

const subjects = [
  { code: "ITCS210", name: "Fundamental Programming Concepts" },
  { code: "ITCS212", name: "Data Structures" },
  { code: "ITCS332", name: "Information System Analysis and Design" },
  { code: "ICCS340", name: "Database Systems" },
  { code: "ITCS371", name: "Introduction to Software Engineering" },
];

const languages = [
  "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#",
  "SQL", "HTML", "CSS", "PHP", "Ruby", "Go", "Rust", "Swift",
];

function detectPersonalData(text: string): string[] {
  const issues: string[] = [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+66|0)\d{2,3}[-.\s]?\d{3}[-.\s]?\d{3,4}/g;
  const studentIdRegex = /\b\d{7,10}\b/g;

  if (emailRegex.test(text)) issues.push("Email address detected");
  if (phoneRegex.test(text)) issues.push("Phone number detected");
  if (studentIdRegex.test(text)) issues.push("Student ID detected");

  return issues;
}

export function QuestionCreator({ open, onOpenChange, onPostCreated }: QuestionCreatorProps) {
  const router = useRouter();
  const { anonymitySimulated, simulatedName } = useTestContext();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([]);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeIdCounter = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Study Session Mode
  const [isStudySession, setIsStudySession] = useState(false);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [sessionLink, setSessionLink] = useState("");
  const [sessionMaxParticipants, setSessionMaxParticipants] = useState("20");
  const [sessionMeetingType, setSessionMeetingType] = useState<"in-person" | "online" | "hybrid">("in-person");

  const allText = `${title} ${content} ${codeBlocks.map((c) => c.code).join(" ")}`;
  const personalDataIssues = detectPersonalData(allText);
  const auditPassed = personalDataIssues.length === 0;

  // Stable anonymous handle so the preview doesn't reshuffle on every keystroke
  const anonNumberRef = useRef(String(Math.floor(Math.random() * 99) + 1).padStart(2, "0"));
  const anonPreviewNumber = anonNumberRef.current;

  const canSubmit = title && subject && auditPassed && (!isStudySession || (sessionDate && sessionTime));

  // Handle keyboard shortcuts (Cmd+Enter or Ctrl+Enter to submit)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  }, [canSubmit, isSubmitting]);

  /* ---------- Draft autosave ---------- */
  const DRAFT_KEY = "questionDraft";
  const draftLoaded = useRef(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Restore a draft the first time the modal opens
  useEffect(() => {
    if (!open || draftLoaded.current) return;
    draftLoaded.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d?.title && !d?.content && !(d?.codeBlocks?.length)) return;

      setTitle(d.title || "");
      setContent(d.content || "");
      setSubject(d.subject || "");
      setTags(Array.isArray(d.tags) ? d.tags : []);
      setCodeBlocks(Array.isArray(d.codeBlocks) ? d.codeBlocks : []);
      setVideoUrl(d.videoUrl || "");
      setIsAnonymous(!!d.isAnonymous);
      setIsStudySession(!!d.isStudySession);
      setSessionDate(d.sessionDate || "");
      setSessionTime(d.sessionTime || "");
      setSessionLocation(d.sessionLocation || "");
      setSessionLink(d.sessionLink || "");
      setSessionMaxParticipants(d.sessionMaxParticipants || "20");
      setSessionMeetingType(d.sessionMeetingType || "in-person");
      setDraftRestored(true);
    } catch {}
  }, [open]);

  // Persist the draft as the user types (files are skipped — too large for localStorage)
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const isEmpty = !title && !content && !subject && tags.length === 0 && codeBlocks.length === 0;
      if (isEmpty) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            title, content, subject, tags, codeBlocks, videoUrl, isAnonymous,
            isStudySession, sessionDate, sessionTime, sessionLocation, sessionLink,
            sessionMaxParticipants, sessionMeetingType,
            savedAt: Date.now(),
          })
        );
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [
    open, title, content, subject, tags, codeBlocks, videoUrl, isAnonymous,
    isStudySession, sessionDate, sessionTime, sessionLocation, sessionLink,
    sessionMaxParticipants, sessionMeetingType,
  ]);

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    resetForm();
    setDraftRestored(false);
    toast.info("ล้างฉบับร่างแล้ว");
  };

  const addCodeBlock = () => {
    codeIdCounter.current += 1;
    setCodeBlocks((prev) => [
      ...prev,
      { id: `code-${codeIdCounter.current}`, language: "Python", code: "" },
    ]);
  };

  const updateCodeBlock = (id: string, field: keyof CodeBlock, value: string) => {
    setCodeBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const removeCodeBlock = (id: string) => {
    setCodeBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(1)} KB`;

  const handleFiles = (fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      if (file.size > MAX_FILE_BYTES) {
        toast.error("ไฟล์ใหญ่เกินไป", {
          description: `${file.name} มีขนาด ${formatSize(file.size)} — จำกัดไม่เกิน 10MB`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: FileUpload = {
          file,
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          size: formatSize(file.size),
          preview: file.type.startsWith("image/") ? e.target?.result as string : undefined,
        };
        setFiles((prev) => [...prev, newFile]);
      };
      reader.onerror = () => {
        toast.error("อ่านไฟล์ไม่สำเร็จ", { description: file.name });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^\s*#\s*(.*)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^\s*\*\*\s*(.*)$/gm, '<li class="ml-4">$1</li>')
      .replace(/^\s*-\s*(.*)$/gm, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br />');
  };

  const toggleStudySession = (checked: boolean) => {
    setIsStudySession(checked);
    if (checked) {
      // Auto-add study session tags
      const newTags = [...new Set([...tags, "#ติวก่อนสอบ", "#StudyGroup"])];
      setTags(newTags);
    } else {
      // Remove study session tags
      setTags(tags.filter(t => !studySessionTags.includes(t)));
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (personalDataIssues.length > 0) {
        toast.error("Personal Data Detected", {
          description: `Please remove: ${personalDataIssues.join(", ")}`,
        });
      } else {
        toast.error("Missing Required Fields", {
          description: `Please fill in: ${!title ? "Title" : ""} ${!subject ? "Subject" : ""} ${isStudySession && !sessionDate ? "Date" : ""} ${isStudySession && !sessionTime ? "Time" : ""}`.trim(),
        });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call delay

      if (onPostCreated && title && subject) {
        const anonName = `Anonymous Student #${anonPreviewNumber}`;
        const finalTags = isStudySession
          ? [...new Set([...tags, "#ติวก่อนสอบ", "#StudyGroup"])]
          : tags;

        const newId = await onPostCreated({
          id: Date.now(),
          title,
          tags: finalTags,
          description: content,
          author: {
            name: isAnonymous ? anonName : "You",
            initials: isAnonymous ? "?" : "YO",
            year: "Year 2",
            department: "Computer Science",
          },
          comments: 0,
          subject,
          subjectColor: subject === "ITCS210" ? "#7c3aed"
            : subject === "ITCS212" ? "#0891b2"
            : subject === "ITCS332" ? "#dc2626"
            : subject === "ICCS340" ? "#c026d3"
            : "#7c3aed",
          isSolved: false,
          isVerified: false,
          views: 0,
          replies: 0,
          createdAt: Date.now(),
          codeBlocks,
          files,
          videoUrl,
          isAnonymous,
          isMine: true,
          isStudySession,
          sessionDate: isStudySession ? sessionDate : undefined,
          sessionTime: isStudySession ? sessionTime : undefined,
          sessionLocation: isStudySession ? sessionLocation : undefined,
          sessionLink: isStudySession ? sessionLink : undefined,
          sessionMaxParticipants: isStudySession ? parseInt(sessionMaxParticipants) : undefined,
          sessionCurrentParticipants: 0,
          sessionMeetingType: isStudySession ? sessionMeetingType : undefined,
        });

        toast.success(isStudySession ? "Study session created!" : "Post published!", {
          description: `Your ${isStudySession ? "study session" : "question"} has been shared with the community.`,
        });

        localStorage.removeItem(DRAFT_KEY);
        setDraftRestored(false);
        resetForm();
        onOpenChange(false);
        if (newId) router.push(`/post/${newId}`);
      }
    } catch (error) {
      toast.error("Failed to publish", {
        description: errMsg(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSubject("");
    setTags([]);
    setIsAnonymous(false);
    setCodeBlocks([]);
    setFiles([]);
    setVideoUrl("");
    setIsStudySession(false);
    setSessionDate("");
    setSessionTime("");
    setSessionLocation("");
    setSessionLink("");
    setSessionMaxParticipants("20");
    setSessionMeetingType("in-person");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8" onClick={() => onOpenChange(false)}>
      <div
        className={cn(
          "bg-card rounded-xl shadow-xl w-full max-w-7xl mx-4 my-4 transition-colors",
          isStudySession && "ring-2 ring-teal-500"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-b border-border",
          isStudySession && "bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30"
        )}>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              {isStudySession ? (
                <><BookOpen className="w-5 h-5 text-teal-600" /> สร้างโพสต์นัดติวสอบ</>
              ) : (
                <>Ask a Question</>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isStudySession ? "นัดเพื่อนมาติวด้วยกันก่อนสอบ" : "Share your question with the community"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Draft restored notice */}
        {draftRestored && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
            <FileText className="w-4 h-4 shrink-0" />
            <span>กู้คืนฉบับร่างล่าสุดของคุณแล้ว — เขียนต่อได้เลย</span>
            <button
              onClick={discardDraft}
              className="ml-auto text-xs font-medium underline hover:no-underline"
            >
              เริ่มใหม่
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row">
          {/* Left: Editor Panel */}
          <div className="flex-1 p-6 space-y-5 border-r border-border">
            {/* Study Session Toggle */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
              isStudySession
                ? "bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700"
                : "bg-secondary/50 border-border"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isStudySession ? "bg-teal-100 dark:bg-teal-900" : "bg-muted"
                )}>
                  <BookOpen className={cn("w-5 h-5", isStudySession ? "text-teal-600" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">📚 Study Session Mode</p>
                  <p className="text-xs text-muted-foreground">สร้างโพสต์นัดติวสอบ — เพิ่มวัน เวลา สถานที่</p>
                </div>
              </div>
              <Switch
                checked={isStudySession}
                onCheckedChange={toggleStudySession}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="q-title" className="text-sm font-medium">Title</Label>
                <span className={cn("text-xs", title.length > 100 ? "text-amber-600" : "text-muted-foreground")}>
                  {title.length}/100
                </span>
              </div>
              <Input
                id="q-title"
                placeholder={isStudySession ? "เช่น ITCS212 - ติวก่อนสอบ Data Structures" : "What's your question? Be specific..."}
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                onKeyDown={handleKeyDown}
                maxLength={100}
                className="mt-1.5"
                aria-label="Post title"
              />
            </div>

            {/* Subject */}
            <div>
              <Label className="text-sm font-medium">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Study Session Fields */}
            {isStudySession && (
              <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200 dark:border-teal-800 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
                  <Calendar className="w-4 h-4" />
                  รายละเอียดการนัดติว
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" /> วันที่ *
                    </Label>
                    <Input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="mt-1.5"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-600" /> เวลา *
                    </Label>
                    <Input
                      type="text"
                      placeholder="เช่น 14:00 - 17:00"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" /> สถานที่
                    </Label>
                    <Input
                      placeholder="เช่น ห้อง 101 ตึก Computer Lab"
                      value={sessionLocation}
                      onChange={(e) => setSessionLocation(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-teal-600" /> จำนวนคนสูงสุด
                    </Label>
                    <Input
                      type="number"
                      min="2"
                      max="100"
                      value={sessionMaxParticipants}
                      onChange={(e) => setSessionMaxParticipants(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">ประเภทการนัดติว</Label>
                  <Select value={sessionMeetingType} onValueChange={(v) => setSessionMeetingType(v as any)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">📍 In-person (见面ตัวต่อตัว)</SelectItem>
                      <SelectItem value="online">💻 Online (Zoom/Google Meet)</SelectItem>
                      <SelectItem value="hybrid">🔀 Hybrid (ทั้งสองแบบ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-teal-600" /> Meeting Link (ถ้ามี)
                  </Label>
                  <Input
                    placeholder="https://zoom.us/j/... หรือ https://meet.google.com/..."
                    value={sessionLink}
                    onChange={(e) => setSessionLink(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <Label className="text-sm font-medium">Tags</Label>
              <div className="mt-1.5 space-y-2">
                <div className="text-xs text-muted-foreground mb-2">
                  Select relevant tags to help others find this question:
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-secondary/30">
                  {tagClouds.map((tag) => {
                    const isSelected = tags.includes(tag);
                    const isStudyTag = studySessionTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setTags((prev) =>
                            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                          );
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
                {tags.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Selected: {tags.join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* Rich Text Editor */}
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <div className="mt-1.5 border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-1 px-3 py-2 bg-secondary/50 border-b border-border">
                  <button onClick={() => setContent((p) => p + "**bold**")} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Bold">
                    <Bold className="w-4 h-4" />
                  </button>
                  <button onClick={() => setContent((p) => p + "*italic*")} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Italic">
                    <Italic className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button onClick={() => setContent((p) => p + "\n- ")} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Bullet List">
                    <List className="w-4 h-4" />
                  </button>
                  <button onClick={() => setContent((p) => p + "\n1. ")} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Numbered List">
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button onClick={() => setContent((p) => p + "[link text](url)")} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Link">
                    <Link2 className="w-4 h-4" />
                  </button>
                  <button onClick={addCodeBlock} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Add Code Block">
                    <Code2 className="w-4 h-4" />
                  </button>
                </div>
                <Textarea
                  ref={textareaRef}
                  placeholder={isStudySession ? "รายละเอียดการนัดติว เช่น เนื้อหาที่จะติว สิ่งที่ต้องเตรียมมา..." : "Describe your question in detail... (Supports **bold**, *italic*, lists)"}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-40 border-0 rounded-none focus-visible:ring-0 resize-none"
                  aria-label="Post description"
                />
              </div>
            </div>

            {/* Code Snippet Blocks */}
            {codeBlocks.map((block) => (
              <div key={block.id} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-green-400" />
                    <Select value={block.language} onValueChange={(v) => updateCodeBlock(block.id, "language", v)}>
                      <SelectTrigger className="w-36 h-7 text-xs bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-400" onClick={() => removeCodeBlock(block.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <CodeEditor
                  language={block.language}
                  value={block.code}
                  onChange={(v) => updateCodeBlock(block.id, "code", v)}
                />
              </div>
            ))}

            <Button variant="outline" onClick={addCodeBlock} className="gap-2">
              <Code2 className="w-4 h-4" />
              Add Code Block
            </Button>

            {/* File Upload & Video */}
            <div>
              <Label className="text-sm font-medium">Attachments</Label>
              <div
                className={cn(
                  "mt-1.5 border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  Drag & drop files here, or{" "}
                  <button onClick={() => fileInputRef.current?.click()} className="text-primary hover:underline font-medium">browse</button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PNG, JPG, PDF, DOCX, PPTX — Max 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf,.docx,.pptx"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 border border-border">
                      {file.preview ? (
                        <img src={file.preview} alt={file.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <FileText className="w-10 h-10 p-2 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(file.id)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                  <Video className="w-3.5 h-3.5" />
                  Or paste a video link (YouTube, etc.)
                </div>
                <Input placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="anonymous" className="text-sm font-medium">Post as Anonymous</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  เมื่อเปิดใช้งาน ระบบจะซ่อนชื่อและอีเมลของคุณจากสาธารณะ
                </p>
              </div>
              <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
          </div>

          {/* Right: Live Preview Panel */}
          <div className="w-full lg:w-[420px] p-6 bg-secondary/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Live Preview
              </h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-primary hover:underline"
                aria-expanded={showPreview}
              >
                {showPreview ? "Hide" : "Show"} Preview
              </button>
            </div>

            {/* Pre-Publishing Audit Badge */}
            <div className={cn(
              "p-3 rounded-lg border mb-4 text-sm font-medium",
              auditPassed ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
            )}>
              <div className="flex items-center gap-2">
                <Shield className={cn("w-5 h-5 shrink-0", auditPassed ? "text-emerald-500" : "text-amber-500")} />
                <div>
                  {auditPassed ? (
                    <span>✓ Pre-Publishing Audit: Safe (No Personal Data Detected)</span>
                  ) : (
                    <span>⚠ Warning: {personalDataIssues.join(", ")}</span>
                  )}
                </div>
              </div>

              {/* Identity status — confirms the anonymity toggle really took effect */}
              <div
                className={cn(
                  "flex items-center gap-2 mt-2 pt-2 border-t text-xs font-medium",
                  auditPassed ? "border-emerald-200" : "border-amber-200",
                  isAnonymous ? "text-emerald-700" : "text-muted-foreground"
                )}
              >
                {isAnonymous ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      🔒 Identity masked — จะโพสต์ในชื่อ{" "}
                      <strong>Anonymous Student #{anonPreviewNumber}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>ยังไม่เปิดโหมดนิรนาม — จะโพสต์ด้วยชื่อจริงของคุณ</span>
                  </>
                )}
              </div>
            </div>

            {/* Preview Card */}
            <Card className={cn("overflow-hidden", !showPreview && "hidden")}>
              <div className="p-5">
                {/* Preview Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {isStudySession && (
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full border border-teal-200">
                      📚 Study Session
                    </span>
                  )}
                  {(isAnonymous || anonymitySimulated) && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-medium rounded-full border border-purple-200">
                      🔒 Anonymous
                    </span>
                  )}
                  {subject && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                      {subject}
                    </span>
                  )}
                  {tags.map((tag) => (
                    <span key={tag} className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full border",
                      studySessionTags.includes(tag) ? "bg-teal-100 text-teal-700 border-teal-200"
                        : tag.startsWith("#") ? "bg-purple-100 text-purple-700 border-purple-200"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                    )}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Preview Session Details */}
                {isStudySession && (sessionDate || sessionTime) && (
                  <div className="mb-3 p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg border border-teal-100 dark:border-teal-900 space-y-1.5">
                    {sessionDate && (
                      <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-300">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{sessionDate}</span>
                      </div>
                    )}
                    {sessionTime && (
                      <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-300">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{sessionTime}</span>
                      </div>
                    )}
                    {sessionLocation && (
                      <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-300">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{sessionLocation}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Preview Title */}
                <h3 className="text-lg font-semibold text-foreground mb-3 leading-tight">
                  {title || <span className="text-muted-foreground italic">Your question title...</span>}
                </h3>

                {/* Preview Content */}
                <div className="text-sm text-foreground/80 mb-4 whitespace-pre-wrap">
                  {content ? (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
                  ) : (
                    <span className="text-muted-foreground italic">Your question description...</span>
                  )}
                </div>

                {/* Preview Code Blocks — line numbers + syntax colours */}
                {codeBlocks.map((block) => (
                  <div key={block.id} className="mb-3">
                    <CodeBlock
                      language={block.language}
                      code={block.code || "// Your code here..."}
                      compact
                    />
                  </div>
                ))}

                {/* Preview Files — images render inline */}
                {files.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {files.map((file) =>
                      file.preview ? (
                        <figure key={file.id} className="rounded-lg overflow-hidden border border-border">
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full max-h-52 object-contain bg-secondary/40"
                          />
                          <figcaption className="px-2 py-1 text-[11px] text-muted-foreground bg-secondary/40 border-t border-border truncate">
                            {file.name} · {file.size}
                          </figcaption>
                        </figure>
                      ) : (
                        <div key={file.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{file.name}</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Preview Author */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {(isAnonymous || anonymitySimulated) ? "?" : "YOU"}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isAnonymous
                      ? `Anonymous Student #${anonPreviewNumber}`
                      : anonymitySimulated
                      ? simulatedName + " (simulated)"
                      : "You"}
                  </span>
                </div>
              </div>
            </Card>

            {!showPreview && (
              <div className="rounded-lg border border-dashed border-border bg-card/50 py-10 text-center">
                <Eye className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">ซ่อนพรีวิวอยู่</p>
                <button
                  onClick={() => setShowPreview(true)}
                  className="mt-1 text-xs text-primary hover:underline"
                >
                  แสดงพรีวิว
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/30">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2"
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Board
          </Button>
          <div className="flex items-center gap-3">
            {canSubmit && (
              <span className="text-xs text-muted-foreground">
                💡 Tip: Press <kbd className="px-2 py-1 bg-secondary rounded text-foreground font-mono">Cmd+Enter</kbd> to submit
              </span>
            )}
            <Button
              className={cn("gap-2", isStudySession && "bg-teal-600 hover:bg-teal-700")}
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isStudySession ? "สร้างโพสต์นัดติว" : "Publish Post"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
