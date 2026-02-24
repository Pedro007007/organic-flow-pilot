

# Enhanced Image Generation Controls

## What Changes

Add per-image controls for **aspect ratio**, **style**, and **model selection** directly on each image card in the Image Management grid. This gives users granular control over each generated image, similar to the reference screenshot showing ratio buttons and style chips.

## Layout (per card)

```text
+---------------------------+
|  [Hero] badge    [Active] |
|  [image thumbnail]        |
|                           |
|  Ratio: [16:9][4:3][1:1]  |
|  Style: [dropdown]        |
|  Model: [dropdown]        |
|  [prompt textarea]        |
|  [Generate / Regenerate]  |
+---------------------------+
```

### Aspect Ratio Selector
A row of small toggle buttons on each card:
- **16:9** (default), **4:3**, **3:2**, **1:1**, **4:5**, **9:16**
- Selected ratio is highlighted; passed to the edge function

### Style Selector
A compact dropdown (Select component) with preset styles:
- Modern Editorial (default)
- Cinematic
- Flat Illustration
- 3D Render
- Watercolor
- Photorealistic
- Minimalist
- Abstract

### Model Selector
A compact dropdown listing available image generation models:
- **Gemini 3 Pro Image** (default) -- current model, high quality
- **Gemini 2.5 Flash Image** -- faster, lighter alternative

Both are free/included via the Lovable AI gateway; no API keys needed.

## Technical Details

### File: `src/components/ContentDetail.tsx`

1. Add new state variables:
   - `heroAspectRatio` (string, default "16:9")
   - `heroStyle` (string, default "")
   - `heroModel` (string, default "google/gemini-3-pro-image-preview")
   - `bodyImageSettings` (Record of index to `{ aspectRatio, style, model }`)

2. On each image card, add three control rows between the thumbnail and the prompt textarea:
   - **Ratio row**: small toggle buttons for each ratio option
   - **Style dropdown**: Select component with style presets
   - **Model dropdown**: Select component with the two available models

3. Pass new parameters (`aspectRatio`, `style`, `model`) in the `supabase.functions.invoke("generate-hero-image", { body: ... })` calls for both hero and body images

### File: `supabase/functions/generate-hero-image/index.ts`

1. Accept new optional parameters from the request body: `aspectRatio`, `style`, `model`
2. Override `imgRatio` with the per-request `aspectRatio` if provided (falls back to brand default)
3. Override `imgStyle` with the per-request `style` if provided (falls back to brand default)
4. Use the per-request `model` if provided instead of the hardcoded model (falls back to `google/gemini-3-pro-image-preview`)
5. Update the prompt composition to use these overridden values (already uses `imgRatio` and `imgStyle` variables, so this is straightforward)

### No database changes required
All new parameters are transient per-generation request; brand-level defaults remain in the existing `image_defaults` JSON field.
