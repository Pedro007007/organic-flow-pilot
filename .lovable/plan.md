
# Redesign Guide Page as a Visual Sitemap

Transform the current accordion-style Guide into a visual sitemap layout -- a tree/flowchart-style page where users can see the entire platform structure at a glance, with expandable nodes for each feature.

## What Changes

### Layout Overhaul
- Replace the linear collapsible list with a **visual sitemap tree** layout
- Group the 15 sections into **4 logical categories** displayed as branches:
  - **Getting Started** -- Sign Up, Brand Setup
  - **Content Engine** -- Keywords, Content Pipeline, Agents, Calendar, Checklist
  - **Intelligence** -- Rankings, LLM Search Lab, Scanner, Analytics
  - **Business** -- Reports, Leads, Team, Settings
- Each category is a visually distinct column/branch with connecting lines
- Individual feature nodes are clickable cards that expand inline to show details + pro tips

### Visual Design
- Top: Searchera logo as the "root node" with lines branching down to categories
- Each category gets a colored header bar matching its theme
- Feature nodes show icon + title + one-line summary; click to expand details
- Dashed connector lines between nodes using CSS borders (no external lib needed)
- Keep the Quick Start hero section at top, slightly simplified
- Retain "Expand All / Collapse All" controls
- Footer CTA stays

### Technical Approach
- Same file: `src/pages/Guide.tsx` -- full rewrite of the render/layout section
- Same data structure (`guideSections` array) with an added `category` field per section
- Pure CSS/Tailwind for connector lines (no diagram library)
- Responsive: on mobile, categories stack vertically as a simple tree; on desktop, 4-column grid with visual connectors
- No new dependencies needed

### Categories Mapping
```text
                    [Searchera]
                        |
     -----------------------------------------------
     |              |              |                |
 [Getting       [Content       [Intelligence   [Business]
  Started]       Engine]        & Tracking]
     |              |              |                |
  Sign Up       Keywords       Rankings         Reports
  Brands        Content        LLM Search       Leads
                Agents         Scanner          Team
                Calendar       Analytics        Settings
                Checklist
```

### Interaction
- Each node is a small card; clicking it expands a detail panel below it (same content as before: bullet points + pro tip)
- Hovering a node highlights the connector line from root
- Smooth open/close animations via existing Collapsible component
