

## Fix: Show "Upgrade Links" Button on More Statuses

The "Upgrade Links" button is only visible when `item.status === "writing"`. The article you're viewing likely has a different status (e.g., "optimizing", "published", or "strategy"). The button should be available whenever there's draft content, regardless of status.

### Change

**`src/components/ContentDetail.tsx`** (line ~554-565):
- Move the "Upgrade Links" button out of the `writing`-only conditional
- Show it whenever `draftContent` exists (any status that has a draft), alongside whichever other buttons are relevant for the current status
- Keep it inside `writing` AND also add it to `optimizing` and `published` statuses — or simply show it independently whenever `draftContent` has content

Specifically: Add a separate condition before the status-specific blocks:
```
{draftContent && (
  <Button ...>Upgrade Links</Button>
)}
```

This ensures the button appears on any article that has draft content, regardless of pipeline stage.

