
# Compact Card Grid for Image Management

## What Changes

The current Image Management section displays images as full-width vertical stripes stacked on top of each other. This will be changed to a responsive card grid where each image (hero + body images) appears as a compact card side by side.

## Layout

```text
+-------------------+-------------------+-------------------+
|   Hero Image      |   Body Image 1    |   Body Image 2    |
|   [thumbnail]     |   [thumbnail]     |   [thumbnail]     |
|   [prompt input]  |   [prompt input]  |   [prompt input]  |
|   [Regenerate]    |   [Regenerate]    |   [Regenerate]    |
+-------------------+-------------------+-------------------+
```

- Uses a responsive grid: 1 column on mobile, 2 on medium screens, 3 on larger screens
- Each card is a compact, equal-height bordered card with the image thumbnail, a small prompt textarea, and a regenerate button
- Hero image card gets a small "Hero" badge; body images get numbered labels
- Image thumbnails use a fixed aspect ratio for visual consistency

## Technical Details

### File: `src/components/ContentDetail.tsx` (lines 451-510)

- Wrap all image cards (hero + body) in a single `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3` container
- Each card becomes a compact bordered div with consistent sizing
- Remove the separate "Body Images" wrapper -- hero and body cards sit in the same grid
- Reduce thumbnail max height and textarea rows for compactness
- Keep all existing functionality (prompt input, regenerate buttons, loading states) unchanged
