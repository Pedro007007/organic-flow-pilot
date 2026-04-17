<final-text>## Investigation Summary

I checked the current UI code and your live backend data. Your concern is valid: the product has strong pieces, but several sections are either disconnected, too generic, or not fed by the right data yet.

### What I found

1. **Analytics is mostly empty because the real feed is broken**
   - Your account currently has:
     - 48 keywords
     - 43 content items
     - 324 agent runs
     - 9 scans
     - 1 report lead
     - 1 GSC connection
     - **0 performance snapshots**
   - The analytics screens depend heavily on `performance_snapshots`.
   - There is a concrete backend bug in the GSC ingestion path: the sync functions write `user.id` instead of `userId`, which prevents snapshot creation.
   - Result: Analytics looks disconnected even though GSC is connected.

2. **Keywords cannot naturally flow into Content**
   - The Keywords table is read-only from a workflow perspective.
   - LLM Search “Add” only inserts a keyword into the keywords table.
   - There is **no proper “Create content from this keyword” path**, so the workflow breaks between discovery and execution.

3. **Checklist is not article-specific**
   - The Checklist is a generic site-wide checklist seeded from a default array.
   - Auto-check reviews broad content summaries, not a selected article in a practical editorial workflow.
   - That’s why it feels vague rather than actionable.

4. **Leads only means report leads**
   - The Leads section only shows `report_leads` from the public report email gate.
   - Your account currently has **1 report lead**.
   - Chatbot leads are a separate admin-only page, so the current naming is misleading.

5. **Scanner is partially real, partially placeholder UX**
   - The scan data is real and stored; you have **9 scans**.
   - But some UI values are hardcoded, like the comparison score cards (`65/100` and `75/100`), and the “Your Website” comparison is not a true live comparison.
   - So it looks more advanced than it really is.

6. **Agents are not yet product-grade**
   - The visible default list shows 6 agents, while the UI guide describes 7 stages.
   - Manual agent runs use the latest keyword/content globally, not a clearly selected target.
   - The sidebar “Agents Active” status is static, not real system state.
   - This makes the automation feel opaque and unreliable.

### Plan to make this usable

#### 1. Fix the data backbone first
- Repair the GSC sync/ingest backend so snapshots are actually created.
- Verify Analytics pulls real data after sync.
- Improve analytics empty states so they explain exactly what is missing:
  - no GSC connection
  - connected but not synced
  - synced but no ranking/page data yet

#### 2. Connect Keywords to Content properly
- Add a clear action from keyword rows:
  - **Create content**
  - optionally **Create & generate**
- Prefill the content dialog with the selected keyword/topic.
- Return users directly into the content workflow instead of making them re-enter data.

#### 3. Make Checklist useful
- Rework Checklist to support:
  - a workspace-level checklist if needed
  - an article-level checklist tied to a specific content item
- From content detail, users should be able to run checks against the current article and see what failed.

#### 4. Make Leads understandable
- Rename or relabel the Leads section so users know it is **Report Leads**.
- Add counts and source labels.
- If desired, merge report leads + chatbot leads into one clearer CRM-style view later.

#### 5. Remove fake-looking Scanner behavior
- Replace hardcoded score cards with actual values from scan data.
- Clarify what Scanner really does:
  - scan a domain
  - estimate SEO gaps
  - surface keywords/meta/schema patterns
- Remove UI that implies real site-vs-site scoring unless that comparison is actually implemented.

#### 6. Clean up Agent workflow
- Align the displayed agents with the real implemented pipeline.
- Show what each agent runs on.
- Prevent “run latest random item” behavior by requiring a selected keyword or content item where relevant.
- Make agent outputs link directly to the affected content or keyword.

### Technical implementation areas

- `supabase/functions/gsc-oauth/index.ts`
- `supabase/functions/gsc-ingest/index.ts`
- `src/components/AnalyticsDashboard.tsx`
- `src/components/analytics/*`
- `src/components/KeywordTable.tsx`
- `src/components/LlmSearchLab.tsx`
- `src/components/ContentPipeline.tsx`
- `src/pages/Index.tsx`
- `src/components/SeoChecklist.tsx`
- `src/components/BusinessScanner.tsx`
- `src/components/LeadsManagement.tsx`
- `src/components/AgentPipeline.tsx`

### Recommended implementation order

1. Fix GSC sync + analytics ingestion
2. Add keyword → content workflow
3. Rework checklist into article-aware QA
4. Clarify leads naming and scope
5. Replace scanner hardcoded values
6. Tighten agent UX and targeting

### Expected outcome

After these changes, the product will feel like a coherent workflow:

**Research keyword → create content → generate article → optimize → publish → track performance**

Right now the data exists in several places, but the product experience does not consistently connect them. The plan above fixes that in the right order.</final-text>