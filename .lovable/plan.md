

## Plan: Add "Executive Support Navigator" AI Chatbot to the Public Report (Lead Capture) Page

### What We're Building
A floating AI chatbot on the `/report/:reportId` page (PublicReport.tsx) that uses the system prompt you provided. It will appear as a floating button in the bottom-right corner — similar to the existing Daniela chatbot but with different branding, persona, and escalation email.

### Architecture

**1. New Edge Function: `support-chat`**
- Clone the `daniela-chat` edge function structure (streaming via Lovable AI Gateway)
- Replace the system prompt with the full "Executive Support Navigator" prompt you provided
- Use `google/gemini-3-flash-preview` model (same as Daniela for speed)
- Keep the same rate limiting and input validation

**2. New Component: `SupportChat.tsx`**
- Floating chat widget (bottom-right corner), similar to DanielaChat but:
  - Branded as "Executive Support Navigator" with a headset/support icon instead of Daniela's avatar
  - No lead capture form gate (the page itself already captures email before showing the report)
  - Color scheme: professional blue/slate to match the report page aesthetic
  - Suggestions: "I need help with my report", "How do I improve my SEO score?", "I have a billing question", "I need to speak to management"
- Streams responses with markdown rendering (reuses the same SSE streaming logic from DanielaChat)

**3. Integration into PublicReport.tsx**
- Import and render `<SupportChat />` on the unlocked report view (after email gate)
- The chatbot floats over the report content, always accessible

### Files to Create/Edit

| File | Action |
|------|--------|
| `supabase/functions/support-chat/index.ts` | Create — new edge function with the Executive Support Navigator system prompt |
| `src/components/SupportChat.tsx` | Create — floating chat widget component |
| `src/pages/PublicReport.tsx` | Edit — add `<SupportChat />` to the unlocked report view |

### Technical Details

- The support chat edge function will use the same streaming SSE pattern as `daniela-chat`
- The system prompt will include the escalation email as `info@searcheraa.com` (as specified)
- The chatbot will be visible on both the email gate screen and the unlocked report, giving visitors immediate access to support
- No database tables needed — this is a stateless chat (no conversation persistence required)

