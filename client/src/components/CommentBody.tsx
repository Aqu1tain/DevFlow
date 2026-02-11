type Segment =
  | { type: "text"; value: string }
  | { type: "cite"; startLine: number; endLine: number; raw: string };

const CITE_RE = /@L(\d+)(?:-(\d+))?/g;

export function parseCitations(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;

  for (const match of text.matchAll(CITE_RE)) {
    if (match.index > last) segments.push({ type: "text", value: text.slice(last, match.index) });
    const start = parseInt(match[1]);
    const end = match[2] ? parseInt(match[2]) : start;
    segments.push({ type: "cite", startLine: start, endLine: Math.max(start, end), raw: match[0] });
    last = match.index + match[0].length;
  }

  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
}

export function hasCitations(text: string) {
  return /@L\d+/.test(text);
}

interface Props {
  body: string;
  code: string;
  stale?: boolean;
  onCiteClick?: (line: number) => void;
}

export default function CommentBody({ body, code, stale, onCiteClick }: Props) {
  const totalLines = code.split("\n").length;

  return (
    <p className="text-sm text-gray-300 whitespace-pre-wrap">
      {parseCitations(body).map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.value}</span>;

        const { startLine, endLine, raw } = seg;

        if (startLine < 1 || endLine > totalLines)
          return (
            <code key={i} className="text-xs font-mono text-gray-500 bg-white/[0.04] px-1 py-0.5">
              {raw}
            </code>
          );

        const color = stale
          ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
          : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20";

        return (
          <code
            key={i}
            className={`text-xs font-mono px-1 py-0.5 cursor-pointer transition-colors ${color}`}
            onClick={() => onCiteClick?.(startLine)}
            title={stale ? "code may have changed since this comment" : `go to line ${startLine}`}
          >
            {raw}
          </code>
        );
      })}
    </p>
  );
}
