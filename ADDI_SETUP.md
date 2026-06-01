ADDI integration — setup and deployment

1) Register redirect URLs in Addi dashboard
- Login to the Addi merchant dashboard (use sandbox or production environment matching your credentials).
- Add the following exact URLs to the "Allowed redirect URLs" / "Callback URLs" settings:
  - https://tenisymas.com/success.html
  - https://tenisymas.com/checkout.html
  - https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/addi-callback

2) Environment variables (Supabase / Deno function)
Set the following variables in your Supabase project (or Deno environment) depending on the target environment:
- ADDI_CLIENT_ID = <your client id>
- ADDI_CLIENT_SECRET = <your client secret>
- ADDI_ALLY_SLUG = tennisymasco-ecommerce
- ADDI_IS_SANDBOX = true   # or false for production

Notes:
- If using staging, set `ADDI_IS_SANDBOX=true` and use staging credentials from Addi.
- If using production, set `ADDI_IS_SANDBOX=false` and use production credentials.

3) How the function reads config
- The function `supabase/functions/addi-checkout/index.ts` reads the vars above via `Deno.env.get()`.
- Defaults are provided for convenience but you MUST set the real credentials in production.

4) Test locally (quick)
- To test auth locally, run:

```bash
node test_addi_auth.js
```

- To test the full flow (calls the deployed Supabase Edge Function):

```bash
node test_addi_direct.js
```

5) Deploy / set vars in Supabase
- In the Supabase dashboard, go to "Functions" > your function > "Environment variables" (or Project Settings > API > Service Role) and add the `ADDI_*` vars.
- Deploy the function (or re-deploy) after setting vars.

6) Troubleshooting
- If you get "The redirect URL is invalid.", ensure the exact URL (including protocol and path) is registered in Addi dashboard.
- If auth fails with "Invalid domain" or similar, check that the credentials belong to the environment (staging vs production) you're calling.
- Check function logs for the `📨 Addi payload:` entry to inspect the exact payload sent.

If you want, I can prepare a small script to automatically set these env vars via the Supabase CLI (you will need the CLI and an access token).