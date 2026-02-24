

# Always Show 3 Image Cards (Hero + Body 1 + Body 2)

## Problem
Currently, body image cards only appear when the article's markdown already contains image placeholders (`![alt](url)`). New or simple articles without those placeholders only show the Hero card, leading to an inconsistent experience.

## Solution
Always render exactly 3 image cards -- **Hero**, **Body 1**, and **Body 2** -- regardless of whether the markdown contains image placeholders. When a body image slot has no existing placeholder in the markdown, clicking "Generate" will create the image and insert it into the content automatically.

## Technical Details

### File: `src/components/ContentDetail.tsx`

1. **Build a fixed 2-slot body images array** instead of relying solely on regex-extracted images:
   - Still parse existing markdown images with the regex
   - Create a `displayBodyImages` array of exactly 2 slots
   - Slot 0 and 1 map to the first and second markdown images if they exist, otherwise they are empty placeholders

2. **Update the Body Image Cards rendering** (around line 632-684):
   - Loop over the fixed 2 slots instead of `bodyImages.map(...)`
   - If a slot has an existing image URL, show the thumbnail and "Regenerate" button (current behavior)
   - If a slot is empty (no placeholder in markdown), show the empty image icon placeholder and a "Generate" button

3. **Update `handleRegenerateBodyImage`** to handle new image insertion:
   - When generating for an empty slot (no `oldMatch`), call the edge function the same way
   - On success, append the new `![keyword](url)` markdown at the end of the draft content (or insert it at a sensible position like after the first few paragraphs for Body 1, and later for Body 2)
   - When regenerating an existing slot, keep the current replace behavior

4. **Track regenerating state per slot** -- the existing `regeneratingImageIndex` already handles this, no change needed

### No backend or database changes required
The edge function already supports generating body images. The only change is ensuring the frontend always presents all 3 slots.
