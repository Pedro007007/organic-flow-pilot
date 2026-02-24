

# Upgrade Image Generation Model

## What Changes

Update the `generate-hero-image` edge function to use `google/gemini-3-pro-image-preview` instead of the current `google/gemini-2.5-flash-image` model for higher quality image generation.

## Technical Details

### File: `supabase/functions/generate-hero-image/index.ts`

- Change the model field from `"google/gemini-2.5-flash-image"` to `"google/gemini-3-pro-image-preview"` in the AI gateway request body
- No other changes needed -- the API format and response handling remain identical

