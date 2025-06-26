
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
    // Use the direct webhook URL for n8n
    const WEBHOOK_URL = 'https://n8n-n8n.mdrxie.easypanel.host/webhook/1a11d6d5-d3bb-4b71-815d-e3bd8b87d118'
    
    console.log('Using webhook URL:', WEBHOOK_URL)

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

    // Get the form data from the request
    const formData = await req.formData()
    
    // Create a new FormData for the webhook
    const webhookData = new FormData()
    
    // Copy all form fields to the webhook data
    for (const [key, value] of formData.entries()) {
      webhookData.append(key, value)
    }
    
    // Add security metadata
    webhookData.append('hotelId', hotelId)
    webhookData.append('timestamp', timestamp)
    webhookData.append('source', 'lovable-app')

    console.log('Sending data to webhook:', WEBHOOK_URL)

    // Forward the request to the webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: webhookData,
      headers: {
        'X-Hotel-ID': hotelId,
        'X-Timestamp': timestamp,
        'X-Source': 'lovable-app'
      }
    })

    console.log('Webhook response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Webhook error response:', errorText)
      throw new Error(`Webhook responded with status: ${response.status} - ${errorText}`)
    }

    const result = await response.text()
    console.log('Webhook success response:', result)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Menu import request processed successfully',
        webhookResponse: result
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
