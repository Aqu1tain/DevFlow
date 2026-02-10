type Segment =
  | { type: "text"; value: string }
  | { type: "cite"; startLine: number; endLine: number; raw: string };

const CITE_RE = /@L(\d+)(?:-(\d+))?/g;

function parseBody(body: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(CITE_RE)) {
    if (match.index > lastIndex) segments.push({ type: "text", value: body.slice(lastIndex, match.index) });
    const start = parseInt(match[1]);
    const end = match[2] ? parseInt(match[2]) : start;
    segments.push({ type: "cite", startLine: start, endLine: Math.max(start, end), raw: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) segments.push({ type: "text", value: body.slice(lastIndex) });
  return segments;
}

interface Props {
  body: string;
  code: string;
}

export default function CommentBody({ body, code }: Props) {
  const segments = parseBody(body);
  const lines = code.split("\n");

  return (
    <span className="text-sm text-gray-300 whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.value}</span>;

        const { startLine, endLine, raw } = seg;
        const inRange = startLine >= 1 && endLine <= lines.length;

        if (!inRange)
          return (
            <code key={i} className="text-xs font-mono text-gray-500 bg-white/[0.04] px-1.5 py-0.5">
              {raw}
            </code>
          );

        const cited = lines.slice(startLine - 1, endLine);
        return (
          <span key={i} className="inline-block align-middle my-0.5">
            <span className="block border border-white/[0.08] bg-white/[0.03] text-xs font-mono overflow-x-auto max-w-sm">
              {cited.map((line, j) => (
                <span key={j} className="flex">
                  <span className="select-none text-emerald-500/60 text-right w-8 shrink-0 px-1.5 bg-white/[0.02]">
                    {startLine + j}
                  </span>
                  <span className="text-gray-300 px-2 whitespace-pre">{line || " "}</span>
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
