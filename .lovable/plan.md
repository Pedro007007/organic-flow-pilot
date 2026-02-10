

# Color Scheme Overhaul: Light Blue + Pink Premium Theme

## Overview
Replace the current dark purple/magenta theme with a premium dark theme using **light blue** as the primary color and **pink** as the accent, creating a modern gradient aesthetic.

## New Color Palette

| Role | Current (Purple) | New (Blue-Pink) |
|------|-----------------|-----------------|
| Primary | `280 80% 65%` (purple) | `210 100% 68%` (light blue) |
| Accent | `320 70% 60%` (magenta) | `340 82% 65%` (soft pink) |
| Background | `270 30% 6%` (dark purple) | `220 30% 6%` (dark navy) |
| Card | `270 30% 9%` (dark purple) | `220 30% 9%` (dark navy) |
| Border | `270 25% 16%` | `220 25% 16%` |
| Muted | `270 25% 12%` | `220 25% 12%` |
| Success | `152 70% 50%` (green) | stays the same |
| Warning | `38 92% 60%` (amber) | stays the same |
| Info | `260 70% 65%` | `210 80% 65%` (matches primary) |

## Files to Change

### 1. `src/index.css` -- CSS Variables
- Update all `:root` HSL values to the new blue-pink palette
- Update glow variables (`--glow-primary`) to use new blue hue
- Update sidebar variables to match
- Update `.text-gradient` to go from blue to pink

### 2. `src/components/AnalyticsDashboard.tsx` -- Hardcoded Chart Colors
- Update `COLORS` array to use blue/pink tones
- Update `CartesianGrid`, `XAxis`, `YAxis` stroke/fill values
- Update `Tooltip` background/border colors
- Update `Line` stroke colors to blue and pink

### 3. `src/components/SidebarNav.tsx` -- Active State
- Uses `bg-primary/10 text-primary` which will auto-update via CSS variables (no change needed)

### 4. `src/pages/Auth.tsx` -- Hardcoded Colors
- Check for any hardcoded purple HSL values in the auth page styling

No other components need changes since they reference CSS variables (`text-primary`, `bg-card`, etc.) which will automatically pick up the new palette.

## Technical Details

The key principle: most components use Tailwind utility classes referencing CSS variables (e.g., `text-primary`, `bg-card`), so changing the variables in `index.css` cascades everywhere. Only `AnalyticsDashboard.tsx` has hardcoded HSL strings for Recharts that need manual updates.

