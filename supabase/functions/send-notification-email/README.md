# send-notification-email

Supabase Edge Function that emails the recipient of a notification via Mailgun.
Invoked from the client by `src/lib/notifications.js` immediately after a
notification row is inserted.

## One-time setup

1. **Install the Supabase CLI** (if you haven't): https://supabase.com/docs/guides/cli

2. **Link the project** (from repo root):
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. **Set the Mailgun secrets** (these are stored server-side, never exposed to the browser):
   ```bash
   supabase secrets set \
     MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
     MAILGUN_DOMAIN=mg.yourdomain.com \
     MAILGUN_FROM='Feedback Tool <noreply@mg.yourdomain.com>' \
     MAILGUN_REGION=us \
     APP_URL=https://feedback.yourdomain.com
   ```
   - `MAILGUN_REGION` is `us` (default) or `eu` depending on where your Mailgun account lives.
   - `APP_URL` is used to build the "View in Feedback Tool" link in the email.

4. **Deploy the function**:
   ```bash
   supabase functions deploy send-notification-email
   ```

That's it. From here on, every notification created by the app will trigger
an email to the recipient.

## Local testing

```bash
supabase functions serve send-notification-email --env-file ./supabase/.env.local
# then in another shell:
curl -i -X POST http://localhost:54321/functions/v1/send-notification-email \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"notification_id":"<some-uuid>"}'
```

## How it fits together

```
client                   notifications table        Edge Function          Mailgun
  │                              │                        │                   │
  │  createNotification()        │                        │                   │
  ├─── insert row ──────────────►│                        │                   │
  │◄─── new row (id) ────────────┤                        │                   │
  │                              │                        │                   │
  ├── functions.invoke('send-notification-email', {id}) ─►│                   │
  │                              │  select recipient,     │                   │
  │                              │  actor, project ──────►│                   │
  │                              │                        ├──── POST /messages ►│
  │                              │                        │◄─── 200 ──────────┤
```

The email send is fire-and-forget from the client — if Mailgun is down, the
in-app notification still works; only the email is lost.
