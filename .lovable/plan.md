
# Add Custom Image Description for Hero Image Generation

## Overview
Add a text input field in the Content Detail page where you can describe exactly what type of hero image you want. This description will be sent to the image generation function and incorporated into the AI prompt, giving you full creative control over the generated image.

## What Changes

### 1. Content Detail Page (`src/components/ContentDetail.tsx`)
- Add a new state variable `imagePromptDescription` to hold the custom description
- Replace the simple "Generate Hero Image" / "Regenerate Hero Image" buttons with a small panel that includes:
  - A text area where you can type your image description (e.g. "A futuristic city skyline with glowing data streams flowing between buildings")
  - A placeholder hint explaining what to write
  - The generate/regenerate button next to it
- Pass the custom description to the `generate-hero-image` edge function call

### 2. Hero Image Edge Function (`supabase/functions/generate-hero-image/index.ts`)
- Accept an optional `customPrompt` field from the request body
- When provided, incorporate the custom description into the image generation prompt (appended as "CLIENT CREATIVE DIRECTION" to guide the AI while keeping the brand and composition rules)
- When not provided, behavior stays exactly as it is today (auto-generated prompt from title/keyword)

## Technical Details

### ContentDetail.tsx changes
- New state: `const [imagePromptDescription, setImagePromptDescription] = useState("");`
- Updated `handleGenerateImage` to include `customPrompt: imagePromptDescription` in the request body
- The "No hero image yet" panel and "Regenerate" area both get a Textarea for the description
- The textarea is optional -- leaving it blank generates with the existing auto-prompt

### Edge function changes
- Extract `customPrompt` from `req.json()` alongside existing fields
- If `customPrompt` is provided, add a section to the image prompt:
  ```
  CLIENT CREATIVE DIRECTION
  {customPrompt}
  Incorporate the above direction into the visual concept while maintaining brand consistency.
  ```
- No other logic changes -- upload, storage, and agent run tracking remain identical
