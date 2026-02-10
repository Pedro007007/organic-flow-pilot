
-- Trigger function: notify on agent run completion
CREATE OR REPLACE FUNCTION public.notify_agent_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IN ('completed', 'error') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'completed' THEN 'success' ELSE 'error' END,
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
  FOR EACH ROW EXECUTE FUNCTION public.notify_agent_completion();

-- Trigger function: notify on content published
CREATE OR REPLACE FUNCTION public.notify_content_published()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'success',
      'Content Published: ' || LEFT(NEW.title, 60),
      COALESCE(NEW.url, NEW.slug, 'No URL yet'),
      jsonb_build_object('content_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_content_published_notify
  AFTER UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION public.notify_content_published();
