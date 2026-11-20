import { supabase } from "@/lib/supabase";
import { getStoredVote } from "@/lib/votes";

// ---------- helpers ----------
export const initials = (name: string, anon = false) =>
  anon ? "?" : (name || "?").split(/[\s.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

export function timeAgo(iso: string | number): string {
  const t = typeof iso === "number" ? iso : new Date(iso).getTime();
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
export const fmtSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`;
const fileKind = (name: string, mime = "") =>
  /pdf/i.test(mime) || /\.pdf$/i.test(name) ? "pdf" : /\.docx?$/i.test(name) ? "docx" : /\.pptx?$/i.test(name) ? "pptx" : "pdf";
const yearLabel = (y: number | null | undefined) => (y ? `Year ${y}` : "");

// ---------- subjects ----------
export interface SubjectRow { code: string; name: string; color: string; short_code: string }
let subjectCache: SubjectRow[] | null = null;
export async function loadSubjects(): Promise<SubjectRow[]> {
  if (subjectCache) return subjectCache;
  const { data, error } = await supabase.from("subjects").select("*").order("code");
  if (error) throw error;
  subjectCache = (data as SubjectRow[]) ?? [];
  return subjectCache;
}
const colorOf = (subs: SubjectRow[], code: string) => subs.find((s) => s.code === code)?.color ?? "#7c3aed";

// ---------- feed ----------
export function mapFeedRow(r: any, subs: SubjectRow[]) {
  const joined = !!r.session_joined;
  return {
    id: r.id as number,
    title: r.title as string,
    tags: (r.tags ?? []) as string[],
    author: {
      name: r.author_name as string,
      initials: initials(r.author_name, r.is_anonymous),
      year: yearLabel(r.author_year),
      department: r.author_department ?? "",
    },
    comments: r.answer_count as number,
    subject: r.subject_code as string,
    subjectColor: colorOf(subs, r.subject_code),
    isSolved: !!r.is_solved,
    isVerified: !!r.is_verified,
    views: r.view_count as number,
    replies: r.answer_count as number,
    createdAt: new Date(r.created_at).getTime(),
    description: (r.body ?? "") as string,
    codeBlocks: [] as any[],
    files: [] as any[],
    videoUrl: (r.video_url ?? "") as string,
    isAnonymous: !!r.is_anonymous,
    isMine: !!r.is_mine,
    isStudySession: !!r.is_study_session,
    sessionDate: r.session_date ?? undefined,
    sessionTime: r.session_time ?? undefined,
    sessionLocation: r.session_location ?? undefined,
    sessionLink: r.session_link ?? undefined,
    sessionMaxParticipants: r.session_max ?? undefined,
    // baseline excludes the current user; the UI adds +1 when joined
    sessionCurrentParticipants: Math.max(0, (r.session_count ?? 0) - (joined ? 1 : 0)),
    sessionMeetingType: r.session_type ?? undefined,
    joined,
  };
}

export async function loadFeed() {
  const [subs, feed] = await Promise.all([
    loadSubjects(),
    supabase.from("question_feed").select("*").order("created_at", { ascending: false }).limit(500),
  ]);
  if (feed.error) throw feed.error;
  return (feed.data ?? []).map((r) => mapFeedRow(r, subs));
}

export async function loadPinnedFiles() {
  const { data, error } = await supabase
    .from("files")
    .select("id,file_name,mime_type,size_bytes,subject_code,storage_path,questions(question_tags(tags(name)))")
    .eq("is_pinned", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((f: any) => ({
    id: f.id as string,
    name: f.file_name as string,
    type: fileKind(f.file_name, f.mime_type) as "pdf" | "docx" | "pptx",
    subject: f.subject_code as string,
    size: fmtSize(f.size_bytes),
    path: f.storage_path as string,
    tags: [f.subject_code, ...((f.questions?.question_tags ?? []).map((t: any) => t.tags?.name).filter(Boolean))] as string[],
  }));
}

// ---------- storage ----------
export async function uploadFiles(userId: string, files: { file?: File; name: string; type: string }[]) {
  const out: any[] = [];
  for (const f of files) {
    if (!f.file) continue;
    const safe = f.name.replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/${crypto.randomUUID()}-${safe}`;
    const { error } = await supabase.storage.from("academic-files").upload(path, f.file, { contentType: f.type || undefined });
    if (error) throw error;
    out.push({ storage_path: path, file_name: f.name, mime_type: f.type || "application/octet-stream", size_bytes: f.file.size });
  }
  return out;
}
export async function signedUrl(path: string, download?: string) {
  const { data, error } = await supabase.storage.from("academic-files").createSignedUrl(path, 300, download ? { download } : undefined);
  if (error) throw error;
  return data.signedUrl;
}

// ---------- write: questions ----------
export async function createQuestion(q: {
  subject: string; title: string; body: string; tags: string[]; isAnonymous: boolean; videoUrl?: string;
  codeBlocks: { language: string; code: string }[]; files: any[]; session?: any | null;
}) {
  const { data, error } = await supabase.rpc("create_question", {
    p_subject: q.subject, p_title: q.title, p_body: q.body, p_tags: q.tags, p_is_anonymous: q.isAnonymous,
    p_video_url: q.videoUrl || null,
    p_code: q.codeBlocks.map((c) => ({ language: c.language, code: c.code })),
    p_files: q.files, p_session: q.session ?? null,
  });
  if (error) throw error;
  return data as number;
}
export async function updateQuestion(id: number, title: string, body: string, tags: string[]) {
  const { error } = await supabase.rpc("update_question", { p_id: id, p_title: title, p_body: body, p_tags: tags });
  if (error) throw error;
}
export async function deleteQuestion(id: number) {
  const { error } = await supabase.rpc("delete_question", { p_id: id });
  if (error) throw error;
}
export const incrementView = (id: number) => { supabase.rpc("increment_view", { p_question: id }).then(() => {}); };
export async function joinSession(id: number, join: boolean) {
  const { error } = await supabase.rpc("join_session", { p_q: id, p_join: join });
  if (error) throw error;
}
export async function setBookmark(userId: string, qid: number, on: boolean) {
  const r = on
    ? await supabase.from("bookmarks").upsert({ user_id: userId, question_id: qid })
    : await supabase.from("bookmarks").delete().eq("user_id", userId).eq("question_id", qid);
  if (r.error) throw r.error;
}
export async function isBookmarked(userId: string, qid: number) {
  const { data } = await supabase.from("bookmarks").select("question_id").eq("user_id", userId).eq("question_id", qid).maybeSingle();
  return !!data;
}
export async function reportContent(type: "question" | "answer" | "comment", id: number, reason: string) {
  const { error } = await supabase.rpc("report_content", { p_type: type, p_id: id, p_reason: reason });
  if (error) throw error;
}

// ---------- post detail ----------
function mapComment(c: any, myUid: string, kids: Map<number | null, any[]>): any {
  return {
    id: c.id,
    content: c.body,
    author: {
      name: c.profiles?.display_name ?? "User",
      initials: initials(c.profiles?.display_name ?? "User"),
      year: yearLabel(c.profiles?.year),
      department: c.profiles?.department ?? "",
      role: c.profiles?.role === "admin" ? "instructor" : (c.profiles?.role ?? "student"),
    },
    votes: c.vote_score - getStoredVote(`reply:${c.id}`),
    createdAt: timeAgo(c.created_at),
    isMine: c.author_id === myUid,
    replies: (kids.get(c.id) ?? []).map((k) => mapComment(k, myUid, kids)),
  };
}

export function mapAnswer(a: any, comments: any[], myUid: string) {
  const kids = new Map<number | null, any[]>();
  comments.filter((c) => c.answer_id === a.id).forEach((c) => {
    const k = c.parent_id ?? null;
    kids.set(k, [...(kids.get(k) ?? []), c]);
  });
  return {
    id: a.id,
    content: a.body,
    author: {
      name: a.profiles?.display_name ?? "User",
      initials: initials(a.profiles?.display_name ?? "User"),
      year: yearLabel(a.profiles?.year),
      department: a.profiles?.department ?? "",
      role: a.profiles?.role === "admin" ? "instructor" : (a.profiles?.role ?? "student"),
    },
    votes: a.vote_score - getStoredVote(`answer:${a.id}`),
    isAccepted: !!a.is_accepted,
    isVerified: !!a.is_verified,
    verifiedBy: a.verifier?.display_name,
    createdAt: timeAgo(a.created_at),
    isMine: a.author_id === myUid,
    comments: (kids.get(null) ?? []).map((c) => mapComment(c, myUid, kids)),
  };
}

export async function loadPost(id: number, myUid: string) {
  const [subs, qr] = await Promise.all([
    loadSubjects(),
    supabase.from("question_feed").select("*").eq("id", id).maybeSingle(),
  ]);
  if (qr.error) throw qr.error;
  if (!qr.data) return null;
  const [code, files, answers] = await Promise.all([
    supabase.from("code_blocks").select("*").eq("question_id", id).order("position"),
    supabase.from("files").select("*").eq("question_id", id),
    supabase.from("answers")
      .select("*,profiles!answers_author_id_fkey(display_name,year,department,role),verifier:profiles!answers_verified_by_fkey(display_name)")
      .eq("question_id", id).order("created_at"),
  ]);
  const ids = (answers.data ?? []).map((a: any) => a.id);
  const comments = ids.length
    ? await supabase.from("comments").select("*,profiles!comments_author_id_fkey(display_name,year,department,role)").in("answer_id", ids).order("created_at")
    : { data: [] as any[] };
  const base = mapFeedRow(qr.data, subs);
  const fileList: any[] = [];
  for (const f of files.data ?? []) {
    let url: string | undefined;
    if (!f.storage_path.startsWith("demo/")) { try { url = await signedUrl(f.storage_path); } catch {} }
    fileList.push({
      id: f.id, name: f.file_name, type: f.mime_type, size: fmtSize(f.size_bytes), url,
      preview: f.mime_type?.startsWith("image/") ? url : undefined, path: f.storage_path, pinned: !!f.is_pinned,
    });
  }
  return {
    ...base,
    content: base.description,
    votes: (qr.data.vote_score ?? 0) - getStoredVote(`question:${id}`),
    views: qr.data.view_count,
    createdAt: timeAgo(qr.data.created_at),
    codeBlocks: (code.data ?? []).map((c: any) => ({ id: c.id, language: c.language, code: c.code })),
    files: fileList,
    answers: (answers.data ?? []).filter((a: any) => !a.deleted_at).map((a: any) =>
      mapAnswer(a, (comments.data ?? []).filter((c: any) => !c.deleted_at), myUid)),
  };
}

// ---------- write: answers / comments ----------
export async function postAnswer(qid: number, body: string, myUid: string) {
  const { data, error } = await supabase.from("answers").insert({ question_id: qid, author_id: myUid, body })
    .select("*,profiles!answers_author_id_fkey(display_name,year,department,role)").single();
  if (error) throw error;
  return mapAnswer(data, [], myUid);
}
export async function postComment(answerId: number, parentId: number | null, body: string, myUid: string) {
  const { data, error } = await supabase.from("comments").insert({ answer_id: answerId, parent_id: parentId, author_id: myUid, body })
    .select("*,profiles!comments_author_id_fkey(display_name,year,department,role)").single();
  if (error) throw error;
  return mapComment(data, myUid, new Map());
}
export async function editRow(table: "answers" | "comments", id: number, body: string) {
  const { error } = await supabase.from(table).update({ body }).eq("id", id);
  if (error) throw error;
}
export async function softDelete(table: "answers" | "comments", id: number) {
  const { error } = await supabase.rpc(table === "answers" ? "delete_answer" : "delete_comment", { p_id: id });
  if (error) throw error;
}
export async function acceptAnswer(id: number) {
  const { error } = await supabase.rpc("accept_answer", { p_answer: id }); if (error) throw error;
}
export async function verifyAnswer(id: number) {
  const { error } = await supabase.rpc("verify_answer", { p_answer: id }); if (error) throw error;
}
export async function pinFile(id: string, pinned: boolean) {
  const { error } = await supabase.rpc("pin_file", { p_file: id, p_pinned: pinned }); if (error) throw error;
}

// ---------- notifications ----------
export async function loadNotifications() {
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
  return (data ?? []) as { id: number; type: string; question_id: number | null; is_read: boolean; created_at: string }[];
}
export async function markNotificationsRead() {
  await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
}

// ---------- admin ----------
export const adminReports = async () => { const r = await supabase.rpc("admin_reports"); if (r.error) throw r.error; return r.data as any[]; };
export const resolveReport = async (id: number, action: "hide" | "dismiss") => {
  const r = await supabase.rpc("resolve_report", { p_id: id, p_action: action }); if (r.error) throw r.error;
};
export const adminStats = async () => { const r = await supabase.rpc("admin_stats"); if (r.error) throw r.error; return r.data as any; };
export const identityLog = async () => { const r = await supabase.rpc("identity_log"); if (r.error) throw r.error; return r.data as any[]; };
export const revealAuthor = async (qid: number, reason: string) => {
  const r = await supabase.rpc("reveal_author", { p_question: qid, p_reason: reason }); if (r.error) throw r.error; return r.data as any;
};
export const listUsers = async () => {
  const r = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(300);
  if (r.error) throw r.error; return r.data as any[];
};
export const setUserRole = async (id: string, role: string) => {
  const r = await supabase.rpc("set_user_role", { p_user: id, p_role: role }); if (r.error) throw r.error;
};
export const setUserSuspended = async (id: string, s: boolean) => {
  const r = await supabase.rpc("set_user_suspended", { p_user: id, p_suspended: s }); if (r.error) throw r.error;
};

// ---------- profile ----------
export async function updateProfile(id: string, p: { display_name: string; year: number | null; department: string | null; avatar_url: string | null }) {
  const { error } = await supabase.from("profiles").update(p).eq("id", id);
  if (error) throw error;
}
export async function loadMySubjects(uid: string) {
  const { data } = await supabase.from("user_subjects").select("subject_code").eq("user_id", uid);
  return (data ?? []).map((r: any) => r.subject_code as string);
}
export async function saveMySubjects(uid: string, codes: string[]) {
  await supabase.from("user_subjects").delete().eq("user_id", uid);
  if (codes.length) {
    const { error } = await supabase.from("user_subjects").insert(codes.map((c) => ({ user_id: uid, subject_code: c })));
    if (error) throw error;
  }
}

// ---------- library (files / code / links, categorised) ----------
export interface LibraryItem {
  item_type: "file" | "code" | "link"; item_id: string; subject_code: string; category: string; title: string;
  size_bytes: number | null; path: string | null; language: string | null; url: string | null;
  is_pinned: boolean; question_id: number | null; created_at: string;
}
export async function loadLibrary(): Promise<LibraryItem[]> {
  const { data, error } = await supabase.from("library_items").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) throw error;
  return (data ?? []) as LibraryItem[];
}
export async function setFileCategory(id: string, cat: string) {
  const { error } = await supabase.rpc("set_file_category", { p_file: id, p_cat: cat });
  if (error) throw error;
}
