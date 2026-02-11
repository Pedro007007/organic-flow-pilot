

# Update GSC Client Secret

## What
Replace the current `GSC_CLIENT_SECRET` with the user's newly generated value from Google Cloud Console.

## Steps
1. Use the secret update tool to set the new `GSC_CLIENT_SECRET` value
2. No code changes needed -- the edge function already reads this secret from the environment
3. User retries the "Connect Google Search Console" flow to verify it works

## Why
Google's token endpoint is returning `invalid_client: Unauthorized`, which means the current stored secret does not match the OAuth client credentials in Google Cloud Console. A freshly generated secret will resolve this.

