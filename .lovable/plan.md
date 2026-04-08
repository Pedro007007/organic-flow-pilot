

## Plan: Add Executive Support Navigator to All Pages

### What We're Doing
Move the `<SupportChat />` component from only the PublicReport page into the global App layout so it appears on every page — dashboard, landing, blog, public report, etc.

### Changes

| File | Action |
|------|--------|
| `src/App.tsx` | Add `<SupportChat />` inside the `<BrowserRouter>` block, after `<Routes>`, so it renders globally on every page |
| `src/pages/PublicReport.tsx` | Remove the duplicate `<SupportChat />` import and usage (since it's now global) |

### How It Works
- The floating "Need Help?" button will appear in the bottom-right corner on every page
- Clicking it opens the chat panel with the Executive Support Navigator
- No other files need to change — the edge function and component already exist

