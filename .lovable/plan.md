

## Plan: Article Generation Loading Overlay with Rotating Messages

### What We're Doing
Add a fullscreen (or modal) loading overlay that appears while an article is being generated. It shows an animated progress indicator with rotating inspirational/fun phrases that cycle through until the content is fully written, ending with a celebration message.

### Changes

| File | Action |
|------|--------|
| `src/components/ContentPipeline.tsx` | Add state for showing the loading overlay + rotating message index. Show overlay during article generation (both normal and autopilot flows). Dismiss on completion/error. |
| `src/components/GenerationOverlay.tsx` | **New file** — A modal overlay component with animated spinner/progress, rotating phrases, and a final celebration state. |

### How It Works

1. **New `GenerationOverlay` component** renders a centered modal backdrop with:
   - A pulsing/spinning animation (e.g. animated pen/sparkle icon)
   - A rotating phrase that changes every ~3 seconds from a curated list:
     - "Your masterpiece is being crafted..."
     - "Researching the competition..."
     - "Weaving words into gold..."
     - "Polishing every paragraph..."
     - "Adding that SEO magic..."
     - "Almost there, perfection takes time..."
     - "Your content is taking shape..."
     - ~10-12 total phrases
   - A subtle progress bar or step indicator reflecting the current pipeline stage (SERP → Strategy → Writing → Done)

2. **In `ContentPipeline.tsx`**:
   - Add `showGenOverlay` boolean state
   - Set `true` when generation starts (after the dialog closes), set `false` on completion or error
   - Pass current stage name to the overlay so it can show contextual messages alongside the rotating fun phrases
   - On success, briefly show a confetti burst + "Your masterpiece has been created! 🎉" before auto-dismissing

3. The overlay blocks interaction during generation so users don't navigate away, giving clear feedback that work is in progress.

### Technical Details
- Phrase rotation via `useEffect` + `setInterval` every 3 seconds cycling through an array
- Stage prop: `"researching" | "strategizing" | "writing" | "optimizing" | "publishing" | "done"`
- Confetti on completion using existing `canvas-confetti` dependency
- Component uses Tailwind animations (`animate-pulse`, `animate-spin`) and backdrop blur

