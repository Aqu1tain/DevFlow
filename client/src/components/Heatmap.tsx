interface Props {
  data: Record<string, number>;
  startDate: Date;
  endDate: Date;
}

const intensity = (count: number) => {
  if (count === 0) return "bg-white/[0.06]";
  if (count <= 2) return "bg-emerald-900";
  if (count <= 5) return "bg-emerald-700";
  if (count <= 9) return "bg-emerald-500";
  return "bg-emerald-400";
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildWeeks(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const dayOffset = start.getDay();

  const cells: (string | null)[] = Array(dayOffset).fill(null);

  const cursor = new Date(start);
  while (cursor <= endDate) {
    cells.push(toDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks: string[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week as string[]);
  }

  return weeks;
}

function getMonthLabels(weeks: string[][]) {
  const labels: { index: number; label: string }[] = [];
  let lastMonth = -1;

  for (let i = 0; i < weeks.length; i++) {
    const firstDate = weeks[i].find((d) => d);
    if (!firstDate) continue;
    const month = parseInt(firstDate.slice(5, 7)) - 1;
    if (month !== lastMonth) {
      labels.push({ index: i, label: MONTHS[month] });
      lastMonth = month;
    }
  }

  return labels;
}

const CELL = 11;
const GAP = 3;
const COL = CELL + GAP;

export default function Heatmap({ data, startDate, endDate }: Props) {
  const weeks = buildWeeks(startDate, endDate);
  const monthLabels = getMonthLabels(weeks);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        <div className="relative h-4" style={{ width: weeks.length * COL }}>
          {monthLabels.map(({ index, label }) => (
            <span
              key={`${label}-${index}`}
              className="text-[10px] font-mono text-gray-600 absolute"
              style={{ left: index * COL }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((date, di) => (
                <div
                  key={di}
                  className={`w-[11px] h-[11px] ${date ? intensity(data[date] || 0) : "bg-transparent"}`}
                  title={date ? `${date}: ${data[date] || 0} contributions` : undefined}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-1.5 mt-1" style={{ width: weeks.length * COL }}>
          <span className="text-[10px] font-mono text-gray-600">less</span>
          {["bg-white/[0.06]", "bg-emerald-900", "bg-emerald-700", "bg-emerald-500", "bg-emerald-400"].map((cls) => (
            <div key={cls} className={`w-[11px] h-[11px] ${cls}`} />
          ))}
          <span className="text-[10px] font-mono text-gray-600">more</span>
        </div>
      </div>
    </div>
  );
}
