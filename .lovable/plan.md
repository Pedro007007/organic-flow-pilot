
## Add User Guide to LLM Search Lab

### What
Add a collapsible "How to use this tool" guide section below the search input card. It will explain every column, badge, and metric in plain language so users know exactly what they're looking at and how to act on it.

### Guide Content

The guide will be a collapsible card (collapsed by default) with a "Help" / "How to read results" toggle. It will cover:

- **Volume** -- Average monthly Google searches. Higher = more people searching. Shows "est." with a tier label (high/medium/low) when exact data isn't available.
- **CPC (Cost Per Click)** -- How much advertisers pay per click on Google Ads. Higher CPC = more commercial value. A $5+ CPC keyword is worth targeting.
- **Competition** -- How many advertisers bid on this keyword. LOW = easier to rank for, HIGH = very competitive.
- **Trend** -- 12-month sparkline showing seasonal patterns. Rising bars = growing interest. Flat = steady demand.
- **Intent** -- Why someone searches this:
  - Informational: wants to learn
  - Commercial: comparing options
  - Transactional: ready to buy
  - Navigational: looking for a specific site
- **Match Status**:
  - Matched: you already track this keyword
  - Partial: similar keyword exists in your tracker
  - Gap: nobody on your team is targeting this yet -- this is your opportunity
- **Action (Add button)** -- Click to add a gap keyword to your keyword tracker so you can create content for it.
- **What to look for** -- Prioritise gaps with high volume, low competition, and commercial/transactional intent. These are the easiest wins.

### Technical Details

**File: `src/components/LlmSearchLab.tsx`**

1. Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from the existing UI components, plus `HelpCircle` and `ChevronDown` icons from lucide-react
2. Add a `showGuide` state (boolean, default false)
3. Insert a collapsible Card between the search input card and the results summary, containing the guide content as a structured list with small text and subtle styling
