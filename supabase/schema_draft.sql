-- =====================================================================
-- ICT Learning Support Forum — Phase 2 (ITDS492) schema DRAFT
-- สถานะ: ร่างเพื่อรีวิว ยังไม่ได้รันบน Supabase จริง
-- ออกแบบจาก: ER Diagram ใน Proposal + ฟีเจอร์ที่มีใน prototype (localStorage)
-- หลักคิดสำคัญ: "ซ่อนชื่อจากผู้ใช้อื่น แต่ระบบเก็บตัวตนไว้ตรวจสอบ"
--   -> ตัวตนผู้ถามเก็บใน schema `private` (API เข้าไม่ถึง)
--   -> ผู้ใช้อ่านผ่าน view `question_feed` ที่ตัดชื่อออกเมื่อ is_anonymous = true
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;   -- Supabase เก็บ extension ไว้ใน schema `extensions`
create schema if not exists private;          -- ไม่ expose ผ่าน Supabase API

-- ---------- ENUMS ----------
create type public.user_role   as enum ('student', 'ta', 'instructor', 'admin');
create type public.vote_target as enum ('question', 'answer', 'comment');

-- ---------- PROFILES ----------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  year         smallint check (year between 1 and 8),
  department   text,
  avatar_url   text,
  role         public.user_role not null default 'student',
  created_at   timestamptz not null default now()
);
-- ผู้ใช้แก้ role ตัวเองไม่ได้ (ให้แก้ได้เฉพาะคอลัมน์เหล่านี้)
revoke update on public.profiles from authenticated;
grant  update (display_name, year, department, avatar_url) on public.profiles to authenticated;

-- สมัครได้เฉพาะอีเมลมหิดล + สร้าง profile อัตโนมัติ  (DECISION: ปรับโดเมนได้)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email !~* '@(student\.)?mahidol\.(edu|ac\.th)$' then
    raise exception 'Mahidol email required';
  end if;
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- SUBJECTS / TAGS ----------
create table public.subjects (
  code       text primary key,              -- ICCS340
  name       text not null,                 -- Database Systems
  short_code text not null,
  color      text not null
);
create table public.user_subjects (          -- "My Subjects"
  user_id      uuid references public.profiles(id) on delete cascade,
  subject_code text references public.subjects(code) on delete cascade,
  primary key (user_id, subject_code)
);
create table public.tags (
  id   int generated always as identity primary key,
  name text not null unique,                -- SQL, #Lab1
  kind text not null default 'topic' check (kind in ('topic', 'hashtag'))
);

-- ---------- QUESTIONS (ไม่มีคอลัมน์ผู้เขียน!) ----------
create table public.questions (
  id           bigint generated always as identity primary key,
  subject_code text not null references public.subjects(code),
  title        text not null check (char_length(title) between 5 and 100),
  body         text not null default '',
  video_url    text,
  is_anonymous boolean not null default false,
  is_solved    boolean not null default false,
  is_verified  boolean not null default false,
  view_count   int not null default 0,
  vote_score   int not null default 0,
  answer_count int not null default 0,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  search_vector tsvector generated always as
    (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, ''))) stored
);
create index questions_search_idx  on public.questions using gin (search_vector);
create index questions_title_trgm  on public.questions using gin (title extensions.gin_trgm_ops);
create index questions_subject_idx on public.questions (subject_code, created_at desc);

create table public.question_tags (
  question_id bigint references public.questions(id) on delete cascade,
  tag_id      int    references public.tags(id) on delete cascade,
  primary key (question_id, tag_id)
);

-- ตัวตนผู้ถาม: เก็บแยก ไม่ผ่าน API  (หัวใจของจุดขาย "ซ่อนชื่อ")
create table private.question_authors (
  question_id bigint primary key references public.questions(id) on delete cascade,
  author_id   uuid not null references public.profiles(id),
  anon_no     smallint not null default (1 + floor(random() * 998))::smallint
);
create index on private.question_authors (author_id);

-- บันทึกทุกครั้งที่มีการเปิดดูตัวตนจริง (ตรวจสอบย้อนหลังได้)
create table private.identity_access_log (
  id          bigint generated always as identity primary key,
  question_id bigint not null,
  accessed_by uuid   not null,
  reason      text   not null,
  accessed_at timestamptz not null default now()
);

-- ---------- ANSWERS / COMMENTS ----------
create table public.answers (
  id          bigint generated always as identity primary key,
  question_id bigint not null references public.questions(id) on delete cascade,
  author_id   uuid   not null references public.profiles(id),
  body        text   not null check (char_length(body) > 0),
  is_accepted boolean not null default false,
  is_verified boolean not null default false,
  verified_by uuid references public.profiles(id),
  vote_score  int not null default 0,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index on public.answers (question_id, created_at);

create table public.comments (               -- nested reply
  id        bigint generated always as identity primary key,
  answer_id bigint not null references public.answers(id) on delete cascade,
  parent_id bigint references public.comments(id) on delete cascade,
  author_id uuid   not null references public.profiles(id),
  body      text   not null check (char_length(body) > 0),
  vote_score int not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.comments (answer_id, created_at);

create table public.code_blocks (
  id          uuid primary key default gen_random_uuid(),
  question_id bigint references public.questions(id) on delete cascade,
  answer_id   bigint references public.answers(id)   on delete cascade,
  language    text not null,
  code        text not null,
  position    smallint not null default 0,
  check (num_nonnulls(question_id, answer_id) = 1)
);

-- ---------- VOTES ----------
create table public.votes (
  user_id     uuid references public.profiles(id) on delete cascade,
  target_type public.vote_target not null,
  target_id   bigint not null,
  value       smallint not null check (value in (-1, 1)),
  primary key (user_id, target_type, target_id)
);
-- NOTE: polymorphic target -> ไม่มี FK ต้องกันข้อมูลกำพร้าด้วย trigger/cleanup

create function public.apply_vote_delta() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  t public.vote_target := coalesce(new.target_type, old.target_type);
  i bigint            := coalesce(new.target_id,  old.target_id);
  d int               := coalesce(new.value, 0) - coalesce(old.value, 0);
begin
  if t = 'question' then update public.questions set vote_score = vote_score + d where id = i;
  elsif t = 'answer' then update public.answers  set vote_score = vote_score + d where id = i;
  else                    update public.comments set vote_score = vote_score + d where id = i;
  end if;
  return null;
end $$;
create trigger votes_delta after insert or update or delete on public.votes
  for each row execute function public.apply_vote_delta();

-- ---------- FILES (Pinned Academic Assets / ไฟล์แนบ) ----------
-- ไม่มีคอลัมน์ผู้อัปโหลด: ไฟล์ของโพสต์นิรนามจึงไม่เผยตัวตน
create table public.files (
  id           uuid primary key default gen_random_uuid(),
  question_id  bigint references public.questions(id) on delete cascade,
  answer_id    bigint references public.answers(id)   on delete cascade,
  subject_code text not null references public.subjects(code),
  storage_path text not null unique,           -- path ใน Supabase Storage
  file_name    text not null,
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes <= 10 * 1024 * 1024),
  is_pinned    boolean not null default false, -- ปักหมุดโดย TA/อาจารย์เท่านั้น
  pinned_by    uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  check (num_nonnulls(question_id, answer_id) <= 1)
);
create index on public.files (subject_code, is_pinned);

-- ---------- BOOKMARKS / NOTIFICATIONS ----------
create table public.bookmarks (
  user_id     uuid references public.profiles(id) on delete cascade,
  question_id bigint references public.questions(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);
create table public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('answer', 'reply', 'accepted', 'verified')),
  question_id bigint references public.questions(id) on delete cascade,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.notifications (user_id, is_read, created_at desc);

-- ---------- READ MODEL: view ที่ตัดชื่อเมื่อโพสต์นิรนาม ----------
-- view ทำงานด้วยสิทธิ์เจ้าของ (จงใจ) เพื่ออ่าน schema private ได้
-- Supabase advisor อาจเตือน "security definer view" -> ตั้งใจ ให้บันทึกไว้
create view public.question_feed as
select q.id, q.subject_code, q.title, q.body, q.video_url, q.is_anonymous,
       q.is_solved, q.is_verified, q.view_count, q.vote_score, q.answer_count,
       q.created_at,
       case when q.is_anonymous then 'Anonymous Student #' || qa.anon_no
            else p.display_name end                         as author_name,
       case when q.is_anonymous then null else p.year       end as author_year,
       case when q.is_anonymous then null else p.avatar_url end as author_avatar,
       (qa.author_id = auth.uid())                          as is_mine,
       array(select t.name from public.question_tags qt
             join public.tags t on t.id = qt.tag_id
             where qt.question_id = q.id)                   as tags
from public.questions q
join private.question_authors qa on qa.question_id = q.id
join public.profiles p           on p.id = qa.author_id
where q.deleted_at is null;
revoke all on public.question_feed from anon;
grant select on public.question_feed to authenticated;

-- ---------- WRITE PATH: ผ่าน RPC เท่านั้น ----------
-- ตรวจข้อมูลส่วนตัวฝั่ง server (ของเดิมตรวจแค่ฝั่ง client = ข้ามได้)
create function private.contains_pii(txt text) returns boolean
language sql immutable as $$
  select txt ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'      -- email
      or txt ~  '\m0[689][0-9]{8}\M'                          -- เบอร์มือถือไทย
      or txt ~  '\m[0-9]{8,10}\M'                             -- รหัสนักศึกษา
$$;

create function public.create_question(
  p_subject text, p_title text, p_body text, p_tags text[],
  p_is_anonymous boolean, p_video_url text default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare qid bigint;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if private.contains_pii(p_title || ' ' || coalesce(p_body, '')) then
    raise exception 'personal data detected';
  end if;
  insert into public.questions (subject_code, title, body, video_url, is_anonymous)
  values (p_subject, p_title, coalesce(p_body, ''), p_video_url, p_is_anonymous)
  returning id into qid;
  insert into private.question_authors (question_id, author_id) values (qid, auth.uid());
  insert into public.tags (name) select unnest(p_tags) on conflict (name) do nothing;
  insert into public.question_tags (question_id, tag_id)
    select qid, t.id from public.tags t where t.name = any (p_tags);
  return qid;
end $$;

create function public.increment_view(p_question bigint) returns void
language sql security definer set search_path = '' as $$
  update public.questions set view_count = view_count + 1 where id = p_question;
$$;

create function public.accept_answer(p_answer bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare qid bigint;
begin
  select question_id into qid from public.answers where id = p_answer;
  if not exists (select 1 from private.question_authors
                 where question_id = qid and author_id = auth.uid()) then
    raise exception 'only the question author can accept';
  end if;
  update public.answers   set is_accepted = (id = p_answer) where question_id = qid;
  update public.questions set is_solved = true where id = qid;
end $$;

create function public.verify_answer(p_answer bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('ta', 'instructor')) then
    raise exception 'only TA/instructor can verify';
  end if;
  update public.answers set is_verified = true, verified_by = auth.uid() where id = p_answer;
  update public.questions set is_verified = true
   where id = (select question_id from public.answers where id = p_answer);
end $$;

-- แอดมินเปิดดูตัวตนจริงได้ แต่ต้องระบุเหตุผล และถูกบันทึกเสมอ
create function public.reveal_author(p_question bigint, p_reason text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare a uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'admin only';
  end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  insert into private.identity_access_log (question_id, accessed_by, reason)
  values (p_question, auth.uid(), p_reason);
  select author_id into a from private.question_authors where question_id = p_question;
  return a;
end $$;

-- ---------- SEARCH (Course Tag + Search & Filter) ----------
-- 'simple' + trigram: ภาษาไทยไม่มีตัวตัดคำใน Postgres ต้องทดสอบกับคำค้นไทยจริง
create function public.search_questions(
  q text default null, subject text default null, tag_names text[] default null,
  lim int default 20, off int default 0
) returns setof public.question_feed
language sql stable set search_path = '' as $$
  select f.*
  from public.question_feed f
  join public.questions qq on qq.id = f.id
  where (subject is null or f.subject_code = subject)
    and (tag_names is null or f.tags && tag_names)
    and (q is null or q = ''
         or qq.search_vector @@ plainto_tsquery('simple', q)
         or qq.title ilike '%' || q || '%'
         or extensions.similarity(qq.title, q) > 0.2)
  order by f.created_at desc
  limit lim offset off;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles      enable row level security;
alter table public.subjects      enable row level security;
alter table public.user_subjects enable row level security;
alter table public.tags          enable row level security;
alter table public.questions     enable row level security;
alter table public.question_tags enable row level security;
alter table public.answers       enable row level security;
alter table public.comments      enable row level security;
alter table public.code_blocks   enable row level security;
alter table public.votes         enable row level security;
alter table public.files         enable row level security;
alter table public.bookmarks     enable row level security;
alter table public.notifications enable row level security;

-- อ่านได้ทุกคนที่ล็อกอิน
create policy read_all on public.profiles      for select to authenticated using (true);
create policy read_all on public.subjects      for select to authenticated using (true);
create policy read_all on public.tags          for select to authenticated using (true);
create policy read_all on public.question_tags for select to authenticated using (true);
create policy read_all on public.code_blocks   for select to authenticated using (true);
create policy read_all on public.files         for select to authenticated using (true);
create policy read_live on public.questions    for select to authenticated using (deleted_at is null);
create policy read_live on public.answers      for select to authenticated using (deleted_at is null);
create policy read_live on public.comments     for select to authenticated using (deleted_at is null);

-- questions / question_tags: ไม่มี policy เขียน -> เขียนผ่าน create_question() เท่านั้น
-- answers / comments: เขียนเองได้ในนามตัวเอง
create policy insert_own on public.answers  for insert to authenticated with check (author_id = auth.uid());
create policy update_own on public.answers  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy insert_own on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy update_own on public.comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
-- (กัน user ตั้ง is_accepted/is_verified เองด้วยการ revoke update คอลัมน์ หรือ trigger — TODO ตอนทำจริง)

-- ของส่วนตัว
create policy own_rows on public.user_subjects for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on public.votes         for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_rows on public.bookmarks     for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_read on public.notifications for select to authenticated using (user_id = auth.uid());
create policy own_upd  on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ไฟล์: เพิ่มได้เมื่อแนบกับโพสต์ของตัวเอง (ตรวจในขั้น implement) / ปักหมุดได้เฉพาะ TA/อาจารย์
-- Storage bucket `academic-files`: private bucket + policy ให้ authenticated อ่านได้, เขียนใน path ของตัวเอง

-- schema private: ห้าม role ของ API เข้าถึงโดยตรง
revoke all on schema private from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;
