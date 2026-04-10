

## Plan: Move Support Chat to Header Bar

### What We're Doing
Replace the floating chat bubble with a header icon button (like the Gift, Team, Settings icons) so the support chat is always accessible from the top toolbar — consistent with the existing UI pattern.

### Changes

| File | Action |
|------|--------|
| `src/pages/Index.tsx` | Add a Headset icon button in the header (next to NotificationBell) that toggles a chat panel |
| `src/components/SupportChat.tsx` | Refactor to accept an `open`/`onClose` prop instead of managing its own floating trigger; remove all corner-cycling and floating bubble code; render only the chat panel (as a dropdown/popover anchored to the header button) |
| `src/App.tsx` | Keep SupportChat inside the dashboard route only (no change needed) |

### How It Works
1. A `Headset` icon button is added to the header row, right next to the notification bell and theme toggle — same size, same styling
2. Clicking it opens the chat panel as a fixed dropdown anchored to the top-right area (similar to how notification panels work)
3. The floating bubble, corner-cycling logic, and localStorage corner persistence are all removed
4. The chat panel keeps all existing functionality: streaming messages, suggestions, markdown rendering

### Technical Details
- `SupportChat` receives `open: boolean` and `onClose: () => void` props
- The trigger button lives in `Index.tsx` header, managing `showChat` state
- Chat panel renders as a fixed/absolute positioned card dropping down from the header area (top-right)
- Green online dot stays on the Headset icon to indicate availability

