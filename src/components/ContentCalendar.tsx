import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContentItem } from "@/types/seo";

const statusColors: Record<string, string> = {
  discovery: "bg-info/20 border-info/30 text-info",
  strategy: "bg-warning/20 border-warning/30 text-warning",
  writing: "bg-primary/20 border-primary/30 text-primary",
  optimizing: "bg-warning/20 border-warning/30 text-warning",
  published: "bg-success/20 border-success/30 text-success",
  monitoring: "bg-success/20 border-success/30 text-success",
};

interface ContentCalendarProps {
  content: ContentItem[];
  onSelectItem?: (id: string) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ContentCalendar = ({ content, onSelectItem }: ContentCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0

  const contentByDate = useMemo(() => {
    const map: Record<string, ContentItem[]> = {};
    for (const item of content) {
      const date = item.lastUpdated;
      if (!date) continue;
      if (!map[date]) map[date] = [];
      map[date].push(item);
    }
    return map;
  }, [content]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[80px] border border-border/30 bg-muted/10 rounded-md" />);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const items = contentByDate[dateStr] || [];
    const isToday = dateStr === new Date().toISOString().split("T")[0];

    cells.push(
      <div
        key={day}
        className={`min-h-[80px] border rounded-md p-1.5 transition-colors ${
          isToday ? "border-primary/40 bg-primary/5" : "border-border/30 bg-card"
        }`}
      >
        <span className={`text-[10px] font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
          {day}
        </span>
        <div className="mt-1 space-y-0.5">
          {items.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem?.(item.id)}
              className={`w-full text-left rounded px-1 py-0.5 border text-[9px] font-medium truncate ${statusColors[item.status] || "bg-muted text-muted-foreground border-border"}`}
            >
              {item.title}
            </button>
          ))}
          {items.length > 3 && (
            <span className="text-[9px] text-muted-foreground px-1">+{items.length - 3} more</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Content Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={prevMonth} className="h-7 w-7 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[140px] text-center">{monthName}</span>
          <Button size="sm" variant="ghost" onClick={nextMonth} className="h-7 w-7 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold uppercase text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>
    </div>
  );
};

export default ContentCalendar;
