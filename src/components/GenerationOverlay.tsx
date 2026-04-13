import { useEffect, useState } from "react";
import { Sparkles, Search, FileText, Pen, Settings, Globe, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";

const phrases = [
  "Your masterpiece is being crafted…",
  "Researching the competition…",
  "Weaving words into gold…",
  "Polishing every paragraph…",
  "Adding that SEO magic…",
  "Almost there, perfection takes time…",
  "Your content is taking shape…",
  "Sprinkling in the right keywords…",
  "Structuring for maximum impact…",
  "Fine-tuning readability…",
  "Making search engines fall in love…",
  "Brewing something extraordinary…",
];

const stages: { key: string; label: string; icon: typeof Search }[] = [
  { key: "researching", label: "Researching", icon: Search },
  { key: "strategizing", label: "Strategizing", icon: FileText },
  { key: "writing", label: "Writing", icon: Pen },
  { key: "optimizing", label: "Optimizing", icon: Settings },
  { key: "publishing", label: "Publishing", icon: Globe },
];

interface GenerationOverlayProps {
  open: boolean;
  stage: string;
  done: boolean;
  onDismiss: () => void;
}

const GenerationOverlay = ({ open, stage, done, onDismiss }: GenerationOverlayProps) => {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Rotate phrases every 3s
  useEffect(() => {
    if (!open || done) return;
    const id = setInterval(() => setPhraseIdx((i) => (i + 1) % phrases.length), 3000);
    return () => clearInterval(id);
  }, [open, done]);

  // Fire confetti on done
  useEffect(() => {
    if (!done) return;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
    const t = setTimeout(() => {
      setDismissed(true);
      onDismiss();
    }, 3500);
    return () => clearTimeout(t);
  }, [done, onDismiss]);

  // Reset when overlay reopens
  useEffect(() => {
    if (open) {
      setPhraseIdx(0);
      setDismissed(false);
    }
  }, [open]);

  if (!open || dismissed) return null;

  const currentStageIdx = stages.findIndex((s) => s.key === stage);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-border/40 bg-card p-8 shadow-2xl text-center space-y-6 animate-scale-in">
        {/* Icon */}
        {done ? (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <PartyPopper className="h-8 w-8 text-success" />
          </div>
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-pulse">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        )}

        {/* Phrase */}
        <p className="text-lg font-semibold text-foreground min-h-[1.75rem] transition-all duration-500">
          {done ? "Your masterpiece has been created! 🎉" : phrases[phraseIdx]}
        </p>

        {/* Stage progress */}
        {!done && (
          <div className="flex items-center justify-center gap-1">
            {stages.map((s, i) => {
              const Icon = s.icon;
              const active = i === currentStageIdx;
              const completed = i < currentStageIdx;
              return (
                <div key={s.key} className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                      active
                        ? "bg-primary/15 text-primary"
                        : completed
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < stages.length - 1 && (
                    <div className={`h-px w-3 ${completed ? "bg-success" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Subtle sub-text */}
        {!done && (
          <p className="text-xs text-muted-foreground">This may take a minute — sit back and relax</p>
        )}
      </div>
    </div>
  );
};

export default GenerationOverlay;
