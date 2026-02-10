
# Next Phase: Polish, Notifications, and User Experience

Now that the core pipeline, calendar, analytics, bulk actions, and agent triggers are all built, the next phase focuses on rounding out the platform with quality-of-life improvements and the remaining notification feature.

---

## 1. In-App Notification Triggers from Agents

Currently the `notifications` table and `useNotifications` hook exist, but nothing writes notifications. We'll add automatic notification creation when:

- An agent run completes or fails (insert from edge functions)
- Content moves to "published" status
- A content item is rejected (moved back to discovery)

**Changes:**
- Create a database trigger on `agent_runs` that inserts a notification row on status change to `completed` or `error`
- Create a database trigger on `content_items` that fires a notification when `status` changes to `published`
- Update `NotificationBell` to show richer notification types with icons per category

---

## 2. Email Notifications (Optional Digest)

Add an edge function `send-digest` that:
- Queries recent agent runs, new published content, and ranking changes from the last 24h
- Formats a summary email
- Sends via Lovable AI (no external email service needed -- uses a simple webhook or logs the digest for now)
- Can be scheduled daily from the Settings page

**Changes:**
- New edge function: `supabase/functions/send-digest/index.ts`
- Add a "Daily Digest" toggle in Settings page

---

## 3. Dashboard Welcome & Empty States

Improve the first-run experience:
- Show a welcome card on the dashboard when there are zero content items, guiding the user to create their first piece
- Add empty state illustrations/messages to Calendar, Analytics, and Keywords pages

**Changes:**
- Update `Index.tsx` dashboard section with a conditional welcome card
- Add empty states to `ContentCalendar`, `AnalyticsDashboard`, `KeywordTable`

---

## 4. Mobile Responsive Sidebar

The sidebar is currently fixed at 224px (`ml-56`). On smaller screens it overlaps or is unusable.

- Add a collapsible hamburger menu for mobile
- Use a Sheet/Drawer for the sidebar on screens < 768px
- Keep the sidebar persistent on desktop

**Changes:**
- Update `SidebarNav.tsx` with mobile toggle
- Update `Index.tsx` layout to handle responsive sidebar

---

## 5. Content Export (CSV)

Allow users to export their content pipeline and keyword data as CSV files for reporting.

**Changes:**
- Add "Export CSV" button to `ContentPipeline` and `KeywordTable`
- Simple client-side CSV generation and download

---

## Technical Details

### Database Migrations

```sql
-- Trigger function: notify on agent run completion
CREATE OR REPLACE FUNCTION notify_agent_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IN ('completed', 'error') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'completed' THEN 'agent_complete' ELSE 'agent_error' END,
      NEW.agent_name || ' ' || NEW.status,
      COALESCE(NEW.error_message, 'Processed ' || COALESCE(NEW.items_processed, 0) || ' items'),
      jsonb_build_object('agent_run_id', NEW.id, 'agent_name', NEW.agent_name)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agent_run_notify
  AFTER UPDATE ON agent_runs
  FOR EACH ROW EXECUTE FUNCTION notify_agent_completion();

-- Trigger function: notify on content published
CREATE OR REPLACE FUNCTION notify_content_published()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'content_published',
      'Content Published: ' || NEW.title,
      COALESCE(NEW.url, NEW.slug),
      jsonb_build_object('content_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_content_published_notify
  AFTER UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION notify_content_published();
```

### Files to Create/Modify

| File | Action |
|------|--------|
| Database migration (triggers above) | Create |
| `supabase/functions/send-digest/index.ts` | Create |
| `src/components/NotificationBell.tsx` | Update - richer notification display |
| `src/components/SettingsPage.tsx` | Update - add digest toggle |
| `src/components/SidebarNav.tsx` | Update - mobile responsive |
| `src/pages/Index.tsx` | Update - welcome card, responsive layout |
| `src/components/ContentPipeline.tsx` | Update - export CSV button |
| `src/components/KeywordTable.tsx` | Update - export CSV button |
| `src/components/ContentCalendar.tsx` | Update - better empty state |

### Sequencing

1. Database triggers (notifications auto-populate)
2. NotificationBell enhancements
3. Settings digest toggle + edge function
4. CSV export buttons
5. Mobile responsive sidebar
6. Welcome card and empty states
