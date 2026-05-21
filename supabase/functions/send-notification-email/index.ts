// Supabase Edge Function: send-notification-email
//
// Looks up a notification by ID, finds the recipient's email, and sends
// an email via Mailgun.
//
// Required env (set with `supabase secrets set ...`):
//   MAILGUN_API_KEY   - your Mailgun API key
//   MAILGUN_DOMAIN    - sending domain registered with Mailgun (e.g. mg.example.com)
//   MAILGUN_FROM      - From header, e.g. "Feedback Tool <noreply@mg.example.com>"
//   MAILGUN_REGION    - "us" (default) or "eu"
//   APP_URL           - public URL of the web app, used to build links (e.g. https://feedback.example.com)
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { notification_id } = await req.json()
    if (!notification_id) {
      return new Response(JSON.stringify({ error: 'notification_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Fetch the notification along with recipient + actor + project
    const { data: notification, error: nErr } = await supabase
      .from('notifications')
      .select(`
        id, type, title, message, project_id, feedback_id, task_id, created_at,
        recipient:user_id ( id, name, email ),
        actor:actor_id ( id, name, email ),
        project:project_id ( id, name )
      `)
      .eq('id', notification_id)
      .single()

    if (nErr || !notification) {
      console.error('Notification lookup failed:', nErr)
      return new Response(JSON.stringify({ error: 'notification not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const recipientEmail = notification.recipient?.email
    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: 'recipient has no email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('MAILGUN_API_KEY')
    const domain = Deno.env.get('MAILGUN_DOMAIN')
    const from = Deno.env.get('MAILGUN_FROM') ?? `Feedback Tool <noreply@${domain}>`
    const region = (Deno.env.get('MAILGUN_REGION') ?? 'us').toLowerCase()
    const appUrl = Deno.env.get('APP_URL') ?? ''

    if (!apiKey || !domain) {
      console.error('Missing Mailgun env vars')
      return new Response(JSON.stringify({ error: 'email not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build a link back into the app. The Notifications page resolves the
    // appropriate destination (feedback or task).
    const link = appUrl ? `${appUrl.replace(/\/$/, '')}/notifications` : ''

    const projectName = notification.project?.name ?? ''
    const actorName = notification.actor?.name ?? 'Someone'
    const subject = projectName
      ? `[${projectName}] ${notification.title}`
      : notification.title

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <h2 style="margin: 0 0 12px;">${escapeHtml(notification.title)}</h2>
        ${projectName ? `<p style="color:#666;margin:0 0 16px;">Project: <strong>${escapeHtml(projectName)}</strong></p>` : ''}
        ${notification.message ? `<div style="background:#f6f6f7;border-radius:8px;padding:14px 16px;margin:0 0 20px;white-space:pre-wrap;">${escapeHtml(notification.message)}</div>` : ''}
        <p style="margin:0 0 24px;color:#444;">From ${escapeHtml(actorName)}</p>
        ${link ? `<p><a href="${link}" style="display:inline-block;background:#c4408f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;">View in Feedback Tool</a></p>` : ''}
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0 12px;" />
        <p style="color:#999;font-size:12px;margin:0;">You're receiving this because you're a member of this project.</p>
      </div>
    `

    const text = [
      notification.title,
      projectName ? `Project: ${projectName}` : '',
      notification.message ?? '',
      `From: ${actorName}`,
      link ? `\nView: ${link}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    const mailgunHost = region === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net'
    const form = new FormData()
    form.append('from', from)
    form.append('to', recipientEmail)
    form.append('subject', subject)
    form.append('text', text)
    form.append('html', html)

    const mgResp = await fetch(`https://${mailgunHost}/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`api:${apiKey}`),
      },
      body: form,
    })

    if (!mgResp.ok) {
      const body = await mgResp.text()
      console.error('Mailgun error:', mgResp.status, body)
      return new Response(JSON.stringify({ error: 'mailgun failed', detail: body }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await mgResp.json()
    return new Response(JSON.stringify({ ok: true, mailgun: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-notification-email error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
