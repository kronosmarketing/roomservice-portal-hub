
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotel-id, x-timestamp',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the secure webhook URL from Supabase secrets
    const WEBHOOK_URL = Deno.env.get('MENU_IMPORT_WEBHOOK_URL')
    
    if (!WEBHOOK_URL) {
      throw new Error('Webhook URL not configured')
    }

    // Verify request headers for security
    const hotelId = req.headers.get('x-hotel-id')
    const timestamp = req.headers.get('x-timestamp')
    
    if (!hotelId || !timestamp) {
      return new Response(
        JSON.stringify({ error: 'Missing required security headers' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify timestamp is recent (within 5 minutes)
    const requestTime = new Date(timestamp)
    const now = new Date()
    const timeDiff = Math.abs(now.getTime() - requestTime.getTime())
    
    if (timeDiff > 300000) { // 5 minutes in milliseconds
      return new Response(
        JSON.stringify({ error: 'Request timestamp too old' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Forward the request to the secure webhook with additional security headers
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: req.body,
      headers: {
        'Content-Type': req.headers.get('content-type') || 'multipart/form-data',
        'X-Hotel-ID': hotelId,
        'X-Timestamp': timestamp,
        'X-Source': 'lovable-app'
      }
    })

    if (!response.ok) {
      throw new Error(`Webhook responded with status: ${response.status}`)
    }

    const result = await response.text()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Menu import request processed successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in menu import:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process menu import',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
