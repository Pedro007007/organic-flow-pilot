
# Meet Daniela -- Your AI SEO/AEO Expert Agent

Build a premium AI chatbot agent named **Daniela** directly on the landing page, featuring a stunning AI-generated avatar and real-time conversational SEO/AEO expertise that guides visitors and drives subscription conversions.

---

## What Gets Built

### 1. Daniela's AI-Generated Avatar
- Use **Lovable AI image generation** (google/gemini-3-pro-image-preview) to generate a 3D ultra-realistic portrait of Daniela -- a beautiful Brazilian woman with light brown hair, professional appearance, warm smile
- Store the generated image in a Supabase storage bucket (`daniela-avatar`)
- Display as a floating circular avatar on the landing page with a glowing pulse animation

### 2. New Landing Page Section -- "Meet Daniela"
- Placed between Testimonials and Security sections
- Left side: Large 3D avatar image with animated glow ring and name/title card
- Right side: Headline + description introducing Daniela as your personal SEO/AEO strategist
- "Chat with Daniela" button opens the chat dialog
- Premium dark gradient background (matching the "How It Works" section style)

### 3. Floating Chat Widget
- A persistent floating button (bottom-right corner) showing Daniela's mini avatar with a pulse indicator
- Clicking opens a full chat dialog overlay
- Chat UI features:
  - Daniela's avatar + name in header
  - Streaming message responses (token-by-token)
  - Markdown rendering for rich responses (lists, bold, code)
  - Suggested quick-start questions (e.g., "What is AEO?", "How can I rank #1?", "What plan suits me?")
  - Subscription CTA woven into responses -- Daniela naturally recommends signing up when relevant

### 4. Backend Edge Function (`daniela-chat`)
- New edge function powered by Lovable AI (google/gemini-3-flash-preview)
- Daniela's system prompt makes her:
  - A world-class SEO and AEO (Answer Engine Optimization) specialist from Brazil
  - Deeply knowledgeable about keyword research, content strategy, technical SEO, schema markup, AI citations, SERP features, and link building
  - Naturally enthusiastic about Searchera's platform capabilities
  - Conversational closer -- guides users toward signing up when appropriate
  - Friendly, confident, and professional with a warm personality
- Supports streaming SSE responses
- Handles rate limit (429) and payment (402) errors gracefully

### 5. Avatar Generation Edge Function (`generate-daniela-avatar`)
- One-time use function to generate Daniela's portrait using the image model
- Uploads result to storage bucket
- Falls back to a high-quality placeholder if generation isn't triggered

---

## Files Created / Modified

| File | Action |
|------|--------|
| `supabase/functions/daniela-chat/index.ts` | **Create** -- Streaming AI chat edge function |
| `supabase/functions/generate-daniela-avatar/index.ts` | **Create** -- Avatar image generation |
| `src/components/DanielaChat.tsx` | **Create** -- Chat widget component (floating button + dialog + streaming messages) |
| `src/components/DanielaSection.tsx` | **Create** -- Landing page "Meet Daniela" section |
| `src/pages/Landing.tsx` | **Edit** -- Import and place DanielaSection + DanielaChat |
| `supabase/config.toml` | **Edit** -- Register both new edge functions |

---

## Technical Details

### System Prompt (Daniela's Personality)
Daniela is configured as an elite SEO/AEO consultant who:
- Explains complex SEO concepts in simple, actionable terms
- Covers on-page SEO, technical SEO, AEO, schema markup, E-E-A-T, Core Web Vitals, backlinks, content clusters, and AI search optimization
- Highlights how Searchera automates these tasks when relevant
- Uses a warm, confident tone and occasionally references her Brazilian background
- Closes toward subscription naturally ("Want me to set this up for you? Start your free trial and I'll guide you through it")

### Chat Widget Architecture
- React state manages messages array and streaming status
- SSE streaming with token-by-token rendering using the established pattern
- `react-markdown` for rendering AI responses
- Quick suggestion chips for first-time users
- Responsive -- works on mobile and desktop
- Chat persists during page session (resets on page reload -- no database needed for landing page chat)

### Avatar Strategy
- Generate once via edge function, store in storage bucket
- Landing page and chat widget reference the stored image URL
- Fallback: use a gradient placeholder with "D" initial if image not yet generated

### Landing Page Layout Update
```
[Hero] -> [Stats] -> [Features] -> [How It Works] -> [Testimonials]
-> [NEW: Meet Daniela] -> [Security] -> [CTA] -> [Footer]
+ Floating chat button (bottom-right, always visible)
```
