import { useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, FileText, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { ContentItem } from "@/types/seo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

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

  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
    setDragItemId(itemId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateStr);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const itemId = e.dataTransfer.getData("text/plain");
    if (!itemId) return;
    setDragItemId(null);

    const { error } = await supabase
      .from("content_items")
      .update({ updated_at: `${targetDate}T12:00:00Z` })
      .eq("id", itemId);

    if (error) {
      toast({ title: "Reschedule failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Content rescheduled", description: `Moved to ${targetDate}` });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    }
  }, [toast, queryClient]);

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[80px] border border-border/30 bg-muted/10 rounded-md" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const items = contentByDate[dateStr] || [];
    const isToday = dateStr === new Date().toISOString().split("T")[0];
    const isDragTarget = dragOverDate === dateStr;

    cells.push(
      <div
        key={day}
        onDragOver={(e) => handleDragOver(e, dateStr)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, dateStr)}
        className={`min-h-[80px] border rounded-md p-1.5 transition-colors ${
          isDragTarget
            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
            : isToday
            ? "border-primary/40 bg-primary/5"
            : "border-border/30 bg-card"
        }`}
      >
        <span className={`text-[10px] font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
          {day}
        </span>
        <div className="mt-1 space-y-0.5">
          {items.slice(0, 3).map((item) => (
            <button
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onClick={() => onSelectItem?.(item.id)}
              className={`w-full text-left rounded px-1 py-0.5 border text-[9px] font-medium truncate cursor-grab active:cursor-grabbing ${
                dragItemId === item.id ? "opacity-50" : ""
              } ${statusColors[item.status] || "bg-muted text-muted-foreground border-border"}`}
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
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Content Calendar</h2>
            <span className="text-[10px] text-muted-foreground ml-2">Drag items to reschedule</span>
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

      {/* How It Works Guide */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-muted/40 transition-colors group">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">How does the Content Calendar work?</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="rounded-lg border border-border bg-card mt-2 p-6 space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">📅 What you see</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every content item from your pipeline is placed on the calendar based on its last-updated date. Color-coded badges show each piece's current status at a glance.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">🎨 Status colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: "Discovery", color: "bg-info/20 text-info" },
                { label: "Strategy", color: "bg-warning/20 text-warning" },
                { label: "Writing", color: "bg-primary/20 text-primary" },
                { label: "Optimizing", color: "bg-warning/20 text-warning" },
                { label: "Published", color: "bg-success/20 text-success" },
                { label: "Monitoring", color: "bg-success/20 text-success" },
              ].map((s) => (
                <div key={s.label} className={`rounded-md px-3 py-2 text-xs font-medium ${s.color}`}>{s.label}</div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">🖱️ Drag & Drop</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Grab any content badge and drag it to a different date to reschedule. The change is saved automatically and your pipeline updates in real time.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">💡 Tips</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
              <li><strong className="text-foreground">Click a badge</strong> to open the full content detail view.</li>
              <li><strong className="text-foreground">Navigate months</strong> with the arrow buttons to plan ahead.</li>
              <li><strong className="text-foreground">Today's date</strong> is highlighted so you can see what's due now.</li>
              <li><strong className="text-foreground">+N more</strong> appears when a date has more than 3 items — click one to explore.</li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ContentCalendar;
