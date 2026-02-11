

## Add Dedicated Leads Management Section

### Overview
Create a new "Leads" section in the sidebar navigation that provides a full-featured leads management experience, replacing the basic list currently buried in Report Settings.

### Changes

**1. New file: `src/components/LeadsManagement.tsx`**
A dedicated component with:
- Summary stats at the top (total leads, leads this week, leads today)
- Search/filter bar to find leads by email or domain
- Full table view using the existing Table UI components showing: email, associated domain (joined from `competitor_scans`), captured date, and status
- CSV export button to download all leads
- The query will join `report_leads` with `competitor_scans` on `scan_id` to show which domain/report each lead came from

**2. Update `src/components/SidebarNav.tsx`**
- Add a new nav item `{ id: "leads", label: "Leads", icon: Users }` between "Reports" and "Checklist"

**3. Update `src/pages/Index.tsx`**
- Import and render `LeadsManagement` when `activeSection === "leads"`
- Add "leads" to the `sectionTitles` map as "Lead Capture"

**4. Clean up `src/components/ReportSettings.tsx`**
- Remove the inline leads table (lines ~402-425) since it now has its own section
- Keep the small badge showing lead count as a quick indicator, linking users to the Leads section

### Technical Details

- Query: `supabase.from("report_leads").select("*, competitor_scans(domain)").eq("user_id", user.id).order("created_at", { ascending: false })`
- CSV export: generate client-side from the loaded data using a simple Blob download
- Search: client-side filter on email and domain fields
- Uses existing `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` components for consistent styling
