

# Daniela Chatbot Email Notifications

## Overview

Add two automated emails triggered when someone completes the Daniela lead form and starts chatting:

1. **Admin notification** -- instant email to you (pedro.acn@consultant.com) with the lead's name, email, phone, and timestamp
2. **Lead follow-up** -- a branded "Thanks for chatting!" email to the person who chatted, with a warm message and CTA to explore Searchera

## Prerequisite: Email Domain Setup

Your project has the custom domain **searcheraa.com** but no email domain is configured yet. We need to set this up first so emails can be sent from something like `hello@searcheraa.com`.

<lov-actions>
<lov-open-email-setup>Set up email domain</lov-open-email-setup>
</lov-actions>

Once the domain is configured and DNS verified, we proceed with implementation.

## Implementation

### 1. New Edge Function: `daniela-lead-email`

A single edge function that sends both emails when invoked:

- **Admin email**: Simple notification with lead details (name, email, phone, time)
- **Lead follow-up**: Branded HTML email thanking them for chatting, with a soft CTA to explore Searchera

Uses the Lovable transactional email API (no external API key needed).

### 2. Frontend Change: `DanielaChat.tsx`

After the lead form is successfully saved to `daniela_leads`, invoke the new edge function:

```
supabase.functions.invoke("daniela-lead-email", {
  body: { name, email, phone }
})
```

This is fire-and-forget -- it won't block the chat from starting even if the email fails.

### Files Changed

- `supabase/functions/daniela-lead-email/index.ts` -- new edge function
- `src/components/DanielaChat.tsx` -- add function invoke after lead insert

### No Database Changes

No new tables or columns needed.

