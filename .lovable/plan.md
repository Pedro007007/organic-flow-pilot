

## Plan: Draggable Support Chat Bubble

### What We're Doing
Make the floating "Need Help?" chat bubble repositionable by letting the user click to cycle it between the four screen corners (bottom-right → bottom-left → top-left → top-right → repeat). A single click on a small "move" handle will snap it to the next corner position.

### Changes

| File | Action |
|------|--------|
| `src/components/SupportChat.tsx` | Add corner-cycling logic with a small move/arrow button on the bubble |

### How It Works
- Add a `corner` state that cycles through `bottom-right`, `bottom-left`, `top-left`, `top-right`
- A small arrow icon (e.g. `Move` from lucide) appears on the floating button — clicking it moves the bubble to the next corner
- The chat panel also repositions to match the active corner
- Position is persisted in `localStorage` so it remembers across sessions
- Smooth CSS transition when moving between corners

### Technical Details
- Corner positions mapped to Tailwind classes: `bottom-6 right-6`, `bottom-6 left-6`, `top-6 left-6`, `top-6 right-6`
- The move button is separate from the "open chat" click target to avoid accidental repositioning
- Both the closed bubble and the open panel share the same corner state

