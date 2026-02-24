
-- Create a secure function to fetch public report data without exposing user_id or sensitive fields
CREATE OR REPLACE FUNCTION public.get_public_report(report_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  scan_row record;
  settings_row record;
  result json;
BEGIN
  -- Fetch the scan only if it's public
  SELECT id, domain, scan_results, created_at
  INTO scan_row
  FROM public.competitor_scans
  WHERE id = report_id AND is_public = true;

  IF scan_row IS NULL THEN
    RETURN json_build_object('error', 'Report not found');
  END IF;

  -- Fetch report settings for the scan owner (without exposing user_id)
  SELECT headline_text, headline_size, subheadline_text, show_headline,
         show_subheadline, hide_blurbs, show_legal_links, show_disclaimer,
         disclaimer_text, colors, cta_blocks
  INTO settings_row
  FROM public.report_settings rs
  WHERE rs.user_id = (SELECT user_id FROM public.competitor_scans WHERE id = report_id);

  RETURN json_build_object(
    'scan', json_build_object(
      'id', scan_row.id,
      'domain', scan_row.domain,
      'scan_results', scan_row.scan_results,
      'created_at', scan_row.created_at
    ),
    'settings', CASE WHEN settings_row IS NOT NULL THEN
      json_build_object(
        'headline_text', settings_row.headline_text,
        'headline_size', settings_row.headline_size,
        'subheadline_text', settings_row.subheadline_text,
        'show_headline', settings_row.show_headline,
        'show_subheadline', settings_row.show_subheadline,
        'hide_blurbs', settings_row.hide_blurbs,
        'show_legal_links', settings_row.show_legal_links,
        'show_disclaimer', settings_row.show_disclaimer,
        'disclaimer_text', settings_row.disclaimer_text,
        'colors', settings_row.colors,
        'cta_blocks', settings_row.cta_blocks
      )
    ELSE NULL END
  );
END;
$$;

-- Grant execute to anon and authenticated so the public report page works
GRANT EXECUTE ON FUNCTION public.get_public_report(uuid) TO anon, authenticated;

-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view public scans" ON public.competitor_scans;
