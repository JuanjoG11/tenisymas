import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple reconciler: lists pending addi orders and queries Addi API for status.
// Requires env:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ADDI_CLIENT_ID, ADDI_CLIENT_SECRET, ADDI_BASE_URL (e.g. https://addi.example.com)
// Optional: ADDI_AUTH_URL (token endpoint)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const dryRun = url.searchParams.get('dryRun') === '1'

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const ADDI_CLIENT_ID = Deno.env.get('ADDI_CLIENT_ID')
    const ADDI_CLIENT_SECRET = Deno.env.get('ADDI_CLIENT_SECRET')
    const ADDI_BASE_URL = Deno.env.get('ADDI_BASE_URL')
    const ADDI_AUTH_URL = Deno.env.get('ADDI_AUTH_URL') || `${ADDI_BASE_URL}/oauth/token`

    if (!SUPABASE_URL || !SERVICE_ROLE) return new Response(JSON.stringify({ error: 'supabase not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (!ADDI_CLIENT_ID || !ADDI_CLIENT_SECRET || !ADDI_BASE_URL) return new Response(JSON.stringify({ error: 'addi creds missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // 1) list pending orders
    const listRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?status=eq.pending&payment_method=eq.addi&select=id,external_reference,created_at,customer_info,metadata`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${SERVICE_ROLE}`, 'apikey': SERVICE_ROLE }
    })
    const listText = await listRes.text()
    let pending: any[] = []
    try { pending = JSON.parse(listText || '[]') } catch (e) { pending = [] }

    // 2) get token from Addi (client_credentials)
    const tokenRes = await fetch(ADDI_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: ADDI_CLIENT_ID, client_secret: ADDI_CLIENT_SECRET })
    })
    const tokenJson = await tokenRes.json().catch(() => ({}))
    const token = tokenJson.access_token
    if (!token) {
      console.error('Could not obtain Addi token', tokenJson)
      return new Response(JSON.stringify({ error: 'no_addi_token', detail: tokenJson }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const results: any[] = []

    for (const o of pending) {
      const ref = encodeURIComponent(o.external_reference)
      try {
        const appRes = await fetch(`${ADDI_BASE_URL}/v1/applications/${ref}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        const appJson = await appRes.json().catch(() => ({}))
        const remoteStatus = (appJson.status || '').toString().toUpperCase()

        let mapped = { status: 'pending', status_payment: remoteStatus }
        if (remoteStatus === 'APPROVED') mapped = { status: 'paid', status_payment: 'APPROVED', paid_at: new Date().toISOString() }
        else if (['REJECTED', 'DECLINED', 'ABANDONED'].includes(remoteStatus)) mapped = { status: 'cancelled', status_payment: remoteStatus }

        results.push({ external_reference: o.external_reference, remoteStatus, mapped })

        if (!dryRun) {
          // patch supabase
          await fetch(`${SUPABASE_URL}/rest/v1/orders?external_reference=eq.${o.external_reference}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${SERVICE_ROLE}`, 'apikey': SERVICE_ROLE, 'Content-Type': 'application/json' },
            body: JSON.stringify(mapped)
          }).catch(e => console.error('patch error', e))
        }
      } catch (e) {
        console.error('error reconciling', o.external_reference, e.message)
      }
    }

    return new Response(JSON.stringify({ pendingCount: pending.length, results }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error('addi-reconcile error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
