"use client";

import { useState, Fragment } from "react";
import { Code2, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Lightweight syntax highlighter — no external dependencies.
   Keeps the original dark (gray-950) code panel look, but adds
   line numbers and per-token colours.
   ============================================================ */

const KEYWORDS: Record<string, string[]> = {
  python: [
    "def", "class", "return", "if", "elif", "else", "for", "while", "import", "from",
    "as", "try", "except", "finally", "raise", "with", "lambda", "yield", "global",
    "nonlocal", "pass", "break", "continue", "and", "or", "not", "in", "is", "None",
    "True", "False", "self", "async", "await", "assert", "del",
  ],
  java: [
    "public", "private", "protected", "class", "interface", "extends", "implements",
    "static", "final", "void", "int", "long", "double", "float", "boolean", "char",
    "String", "new", "return", "if", "else", "for", "while", "do", "switch", "case",
    "default", "break", "continue", "try", "catch", "finally", "throw", "throws",
    "this", "super", "null", "true", "false", "abstract", "package", "import", "enum",
  ],
  javascript: [
    "const", "let", "var", "function", "return", "if", "else", "for", "while", "do",
    "switch", "case", "default", "break", "continue", "try", "catch", "finally",
    "throw", "new", "class", "extends", "super", "this", "import", "export", "from",
    "async", "await", "yield", "typeof", "instanceof", "in", "of", "delete", "void",
    "null", "undefined", "true", "false",
  ],
  typescript: [
    "const", "let", "var", "function", "return", "if", "else", "for", "while", "do",
    "switch", "case", "default", "break", "continue", "try", "catch", "finally",
    "throw", "new", "class", "extends", "implements", "interface", "type", "enum",
    "super", "this", "import", "export", "from", "async", "await", "yield", "typeof",
    "instanceof", "in", "of", "delete", "void", "null", "undefined", "true", "false",
    "public", "private", "protected", "readonly", "as", "namespace", "declare",
  ],
  sql: [
    "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
    "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "VIEW", "JOIN", "INNER", "LEFT",
    "RIGHT", "FULL", "OUTER", "CROSS", "ON", "AS", "AND", "OR", "NOT", "NULL", "IS",
    "IN", "BETWEEN", "LIKE", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET",
    "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX", "PRIMARY", "KEY", "FOREIGN",
    "REFERENCES", "UNION", "ALL", "CASE", "WHEN", "THEN", "END", "EXISTS",
  ],
  c: [
    "int", "char", "float", "double", "long", "short", "void", "struct", "union",
    "enum", "typedef", "const", "static", "extern", "register", "volatile", "return",
    "if", "else", "for", "while", "do", "switch", "case", "default", "break",
    "continue", "goto", "sizeof", "NULL", "include", "define",
  ],
  html: ["html", "head", "body", "div", "span", "script", "style", "link", "meta", "class", "id"],
  css: ["color", "background", "margin", "padding", "border", "display", "flex", "grid", "position", "font"],
  php: ["function", "class", "public", "private", "protected", "return", "if", "else", "elseif", "foreach", "for", "while", "echo", "print", "new", "extends", "implements", "null", "true", "false", "use", "namespace"],
  go: ["func", "package", "import", "var", "const", "type", "struct", "interface", "return", "if", "else", "for", "range", "switch", "case", "default", "break", "continue", "go", "defer", "chan", "select", "map", "nil", "true", "false"],
  ruby: ["def", "end", "class", "module", "if", "elsif", "else", "unless", "while", "until", "do", "return", "yield", "require", "attr_accessor", "nil", "true", "false", "self", "puts"],
  rust: ["fn", "let", "mut", "const", "struct", "enum", "impl", "trait", "pub", "use", "mod", "match", "if", "else", "for", "while", "loop", "return", "self", "Self", "None", "Some", "Ok", "Err", "true", "false"],
  swift: ["func", "let", "var", "class", "struct", "enum", "protocol", "extension", "if", "else", "for", "while", "switch", "case", "default", "return", "guard", "import", "self", "nil", "true", "false"],
};

/** Languages that use `#` for comments */
const HASH_COMMENT = new Set(["python", "ruby", "php"]);
/** Languages that use `--` for comments */
const DASH_COMMENT = new Set(["sql"]);

type TokenKind = "comment" | "string" | "number" | "keyword" | "fn" | "plain";

interface Token {
  kind: TokenKind;
  value: string;
}

const TOKEN_CLASS: Record<TokenKind, string> = {
  comment: "text-gray-500 italic",
  string: "text-amber-300",
  number: "text-cyan-300",
  keyword: "text-purple-400 font-medium",
  fn: "text-blue-400",
  plain: "text-green-400",
};

function buildPattern(lang: string) {
  const key = lang.toLowerCase().replace(/\+/g, "").replace(/#/g, "sharp");
  const keywords =
    KEYWORDS[key] ||
    KEYWORDS[key.replace("sharp", "")] ||
    KEYWORDS.javascript;

  const kwAlt = keywords
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|");

  const commentPattern = HASH_COMMENT.has(key)
    ? "#[^\\n]*"
    : DASH_COMMENT.has(key)
    ? "--[^\\n]*"
    : "//[^\\n]*";

  return new RegExp(
    [
      `(${commentPattern})`,
      `("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`)`,
      `(\\b\\d+(?:\\.\\d+)?\\b)`,
      `(\\b(?:${kwAlt})\\b)`,
      `(\\b[A-Za-z_][A-Za-z0-9_]*(?=\\s*\\())`,
    ].join("|"),
    DASH_COMMENT.has(key) ? "gi" : "g"
  );
}

function tokenizeLine(line: string, lang: string): Token[] {
  if (!line) return [{ kind: "plain", value: "" }];

  const pattern = buildPattern(lang);
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: "plain", value: line.slice(lastIndex, match.index) });
    }

    const kind: TokenKind = match[1]
      ? "comment"
      : match[2]
      ? "string"
      : match[3]
      ? "number"
      : match[4]
      ? "keyword"
      : "fn";

    tokens.push({ kind, value: match[0] });
    lastIndex = match.index + match[0].length;

    if (match[0].length === 0) pattern.lastIndex++;
  }

  if (lastIndex < line.length) {
    tokens.push({ kind: "plain", value: line.slice(lastIndex) });
  }

  return tokens.length ? tokens : [{ kind: "plain", value: line }];
}

/* ============================================================
   Copy button
   ============================================================ */
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
      title={copied ? "Copied!" : "Copy code"}
      aria-label={copied ? "Code copied" : "Copy code to clipboard"}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-400" />
          <span className="text-green-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

/* ============================================================
   CodeBlock — read-only viewer with line numbers + syntax colours
   ============================================================ */
interface CodeBlockProps {
  language: string;
  code: string;
  /** show the dark header bar with language name + copy button */
  showHeader?: boolean;
  showLineNumbers?: boolean;
  className?: string;
  /** smaller text, used inside comment threads */
  compact?: boolean;
}

export function CodeBlock({
  language,
  code,
  showHeader = true,
  showLineNumbers = true,
  className,
  compact = false,
}: CodeBlockProps) {
  const lines = (code ?? "").replace(/\n$/, "").split("\n");
  const gutterWidth = String(lines.length).length;

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400 font-mono">{language}</span>
            <span className="text-[10px] text-gray-600 font-mono">
              {lines.length} {lines.length === 1 ? "line" : "lines"}
            </span>
          </div>
          <CopyCodeButton code={code} />
        </div>
      )}
      <pre
        className={cn(
          "bg-gray-950 overflow-x-auto font-mono leading-relaxed",
          compact ? "text-[11px] p-2" : "text-sm p-4"
        )}
      >
        <code className="table w-full">
          {lines.map((line, i) => (
            <span key={i} className="table-row group">
              {showLineNumbers && (
                <span
                  className="table-cell pr-4 text-right select-none text-gray-600 group-hover:text-gray-400 transition-colors"
                  style={{ minWidth: `${gutterWidth + 1}ch` }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              )}
              <span className="table-cell whitespace-pre-wrap break-words">
                {tokenizeLine(line, language).map((token, j) => (
                  <Fragment key={j}>
                    {token.kind === "plain" ? (
                      <span className="text-green-400">{token.value}</span>
                    ) : (
                      <span className={TOKEN_CLASS[token.kind]}>{token.value}</span>
                    )}
                  </Fragment>
                ))}
                {line === "" && "​"}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

/* ============================================================
   CodeEditor — editable textarea with a live line-number gutter.
   Used inside the post creator so the author also sees line numbers.
   ============================================================ */
interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function CodeEditor({
  language,
  value,
  onChange,
  placeholder,
  minHeight = 150,
}: CodeEditorProps) {
  const lineCount = Math.max(value.split("\n").length, 1);
  const gutterWidth = String(lineCount).length;

  return (
    <div className="relative flex bg-gray-950" style={{ minHeight }}>
      <div
        className="select-none py-4 pl-3 pr-2 text-right font-mono text-sm leading-relaxed text-gray-600 bg-gray-950 border-r border-gray-800"
        style={{ minWidth: `${gutterWidth + 2}ch` }}
        aria-hidden="true"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? `Write your ${language} code here...`}
        className="flex-1 p-4 bg-gray-950 text-green-400 font-mono text-sm leading-relaxed border-0 focus:ring-0 focus:outline-none resize-y placeholder:text-gray-600"
        style={{ minHeight }}
        spellCheck={false}
        aria-label={`${language} code editor`}
      />
    </div>
  );
}
