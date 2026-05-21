// Supabase Edge Function: send-notification-digest
//
// Invoked every 30 minutes by pg_cron. Finds notifications that have not yet
// been emailed (email_sent_at IS NULL), groups them by recipient, sends one
// digest email per recipient via Mailgun, and stamps email_sent_at on the rows
// that were successfully sent.
//
// Required env (set with `supabase secrets set ...`):
//   MAILGUN_API_KEY   - your Mailgun API key
//   MAILGUN_DOMAIN    - sending domain registered with Mailgun (e.g. mg.example.com)
//   MAILGUN_FROM      - From header, e.g. "Feedback Tool <noreply@mg.example.com>"
//   MAILGUN_REGION    - "us" (default) or "eu"
//   APP_URL           - public URL of the web app (e.g. https://feedback.example.com)
//
// Supabase automatically provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeHtml(str: string) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type Notification = {
  id: string
  type: string
  title: string
  message: string | null
  project_id: string | null
  feedback_id: string | null
  task_id: string | null
  created_at: string
  recipient: { id: string; name: string | null; email: string | null } | null
  actor: { id: string; name: string | null } | null
  project: { id: string; name: string | null } | null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const apiKey = Deno.env.get('MAILGUN_API_KEY')
    const domain = Deno.env.get('MAILGUN_DOMAIN')
    const fromRaw = Deno.env.get('MAILGUN_FROM') ?? `Feedback Tool <noreply@${domain}>`
    const from = fromRaw.trim()
    const region = (Deno.env.get('MAILGUN_REGION') ?? 'us').toLowerCase()
    const appUrl = Deno.env.get('APP_URL') ?? ''

    if (!apiKey || !domain) {
      console.error('Missing Mailgun env vars')
      return new Response(JSON.stringify({ error: 'email not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Pull every notification that hasn't been emailed yet.
    const { data: pending, error: fetchErr } = await supabase
      .from('notifications')
      .select(`
        id, type, title, message, project_id, feedback_id, task_id, created_at,
        recipient:user_id ( id, name, email ),
        actor:actor_id ( id, name ),
        project:project_id ( id, name )
      `)
      .is('email_sent_at', null)
      .order('created_at', { ascending: true })

    if (fetchErr) {
      console.error('Failed to fetch pending notifications:', fetchErr)
      return new Response(JSON.stringify({ error: 'fetch failed', detail: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const notifications = (pending ?? []) as unknown as Notification[]
    if (notifications.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, recipients: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Group by recipient email. Skip rows that have no deliverable address.
    const byRecipient = new Map<string, { email: string; name: string; items: Notification[] }>()
    for (const n of notifications) {
      const email = n.recipient?.email
      if (!email) continue
      const key = email.toLowerCase()
      if (!byRecipient.has(key)) {
        byRecipient.set(key, { email, name: n.recipient?.name ?? '', items: [] })
      }
      byRecipient.get(key)!.items.push(n)
    }

    const mailgunHost = region === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net'
    const link = appUrl ? `${appUrl.replace(/\/$/, '')}/notifications` : ''
    const sentIds: string[] = []
    let recipientCount = 0
    const failures: { email: string; status: number; body: string }[] = []

    for (const { email, name, items } of byRecipient.values()) {
      const count = items.length
      const subject =
        count === 1
          ? items[0].title
          : `${count} new notifications from Feedback Tool`

      // Group items by project for nicer rendering
      const byProject = new Map<string, { projectName: string; items: Notification[] }>()
      for (const n of items) {
        const key = n.project?.id ?? '__none__'
        if (!byProject.has(key)) {
          byProject.set(key, { projectName: n.project?.name ?? '', items: [] })
        }
        byProject.get(key)!.items.push(n)
      }

      const projectBlocksHtml = Array.from(byProject.values())
        .map(({ projectName, items: pItems }) => {
          const rowsHtml = pItems
            .map((n) => {
              const actorName = n.actor?.name ?? ''
              const preview = n.message ? escapeHtml(n.message) : ''
              return `
                <li style="margin:0 0 10px;padding:10px 12px;background:#f6f6f7;border-radius:6px;">
                  <div style="font-weight:600;color:#111;">${escapeHtml(n.title)}</div>
                  ${preview ? `<div style="color:#444;margin-top:4px;white-space:pre-wrap;">${preview}</div>` : ''}
                  ${actorName ? `<div style="color:#888;font-size:12px;margin-top:6px;">From ${escapeHtml(actorName)}</div>` : ''}
                </li>
              `
            })
            .join('')
          return `
            ${projectName ? `<h3 style="margin:24px 0 8px;color:#222;font-size:15px;">${escapeHtml(projectName)}</h3>` : ''}
            <ul style="list-style:none;padding:0;margin:0;">${rowsHtml}</ul>
          `
        })
        .join('')

      const greeting = name ? `Hi ${escapeHtml(name.split(' ')[0])},` : 'Hi,'
      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#111;">
          <p style="margin:0 0 16px;">${greeting}</p>
          <p style="margin:0 0 20px;color:#444;">You have ${count} new notification${count === 1 ? '' : 's'} in Feedback Tool:</p>
          ${projectBlocksHtml}
          ${link ? `<p style="margin:28px 0 0;"><a href="${link}" style="display:inline-block;background:#c4408f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;">View all in Feedback Tool</a></p>` : ''}
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0 12px;" />
          <p style="color:#999;font-size:12px;margin:0;">You're receiving this because you're a member of these projects.</p>
        </div>
      `

      const textLines: string[] = []
      textLines.push(`You have ${count} new notification${count === 1 ? '' : 's'}:`)
      textLines.push('')
      for (const { projectName, items: pItems } of byProject.values()) {
        if (projectName) textLines.push(`[${projectName}]`)
        for (const n of pItems) {
          textLines.push(`- ${n.title}`)
          if (n.message) textLines.push(`  ${n.message}`)
        }
        textLines.push('')
      }
      if (link) textLines.push(`View: ${link}`)
      const text = textLines.join('\n')

      const form = new FormData()
      form.append('from', from)
      form.append('to', email)
      form.append('subject', subject)
      form.append('text', text)
      form.append('html', html)

      const mgResp = await fetch(`https://${mailgunHost}/v3/${domain}/messages`, {
        method: 'POST',
        headers: { Authorization: 'Basic ' + btoa(`api:${apiKey}`) },
        body: form,
      })

      if (!mgResp.ok) {
        const body = await mgResp.text()
        console.error('Mailgun error for', email, ':', mgResp.status, body)
        failures.push({ email, status: mgResp.status, body })
        // Don't mark these as sent — they'll be retried on the next cron tick.
        continue
      }

      recipientCount += 1
      for (const n of items) sentIds.push(n.id)
    }

    if (sentIds.length > 0) {
      const { error: updateErr } = await supabase
        .from('notifications')
        .update({ email_sent_at: new Date().toISOString() })
        .in('id', sentIds)

      if (updateErr) {
        console.error('Failed to stamp email_sent_at:', updateErr)
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent: sentIds.length,
        recipients: recipientCount,
        failures,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-notification-digest error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
