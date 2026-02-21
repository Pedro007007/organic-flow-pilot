
# Searchera Master Prompts Reference File

## Overview
Create a single markdown file (`MASTER_PROMPTS.md`) in the project root that contains a copy of every AI prompt used across the platform. This file is purely a **reference document** -- it does NOT power any functionality. The actual prompts remain in their respective edge functions and are not changed.

## What Will Be Created

**File:** `MASTER_PROMPTS.md`

This file will document all **15 prompts** found across the codebase, organized by feature:

1. **Daniela Chat** -- Full system prompt defining her personality, expertise, mission, and response guidelines
2. **Keyword Discovery** -- Senior SEO Research Analyst prompt for identifying keyword opportunities from GSC data
3. **Content Strategy** -- Senior SEO Content Strategist prompt for turning keywords into content plans
4. **SERP Research** -- SEO Competitive Analyst prompt for analyzing top Google results
5. **Content Generation** -- Human-level SEO Copywriter prompt with brand-aware rules, internal linking, and image placeholders
6. **SEO Optimization** -- Technical SEO Specialist prompt for meta tags, slugs, and schema
7. **Content Rewrite** -- Three action-based prompts (rewrite, expand, shorten) with brand voice rules
8. **Content Repurpose** -- Three channel-specific prompts (LinkedIn, YouTube, Twitter)
9. **AEO Score** -- AEO expert prompt for scoring AI-readiness across 5 dimensions
10. **Generate Answer Blocks** -- AEO content optimizer prompt for TL;DR, takeaways, and FAQs
11. **Optimization Score** -- SEO Content Scoring Expert prompt with 5-dimension scoring
12. **Monitor & Refresh** -- Search Performance Optimisation Analyst prompt with refresh triggers
13. **Business Scanner** -- Expert SEO analyst prompt for comprehensive domain intelligence reports
14. **Fulfilment Scan** -- SEO auditor prompt for verifying checklist criteria against content
15. **Checklist Verify** -- SEO auditor prompt for site-wide checklist verification
16. **Rankings Check** -- AI citation estimation prompt
17. **LLM Search Lab** -- Keyword research assistant prompt for generating search queries
18. **Hero Image Generation** -- Image generation prompt template
19. **Daniela Avatar Generation** -- 3D portrait generation prompt
20. **Send Digest** -- (No AI prompt, data aggregation only)

## Technical Details

- **Location:** `MASTER_PROMPTS.md` at the project root
- **Format:** Markdown with clear headings, code blocks for each prompt, and notes about dynamic variables (e.g., `${brand.name}`, `${keyword}`)
- **No logic changes:** Zero modifications to any edge function or component file
- **Single new file:** Only one file created, nothing else touched
