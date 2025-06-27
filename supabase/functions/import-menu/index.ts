
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotel-id, x-timestamp',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Función para validar y sanitizar entradas
const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, 1000);
};

// Función para validar formato UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting menu import process...')

    // Verificar y validar headers de seguridad
    const hotelId = req.headers.get('x-hotel-id')
    const timestamp = req.headers.get('x-timestamp')
    
    if (!hotelId || !timestamp) {
      console.error('Missing security headers')
      return new Response(
        JSON.stringify({ error: 'Missing required security headers' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validar formato del hotel ID
    if (!isValidUUID(hotelId)) {
      console.error('Invalid hotel ID format:', hotelId)
      return new Response(
        JSON.stringify({ error: 'Invalid hotel ID format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar que el timestamp es reciente (dentro de 2 minutos para mayor seguridad)
    const requestTime = new Date(timestamp)
    const now = new Date()
    const timeDiff = Math.abs(now.getTime() - requestTime.getTime())
    
    if (timeDiff > 120000) { // 2 minutos en milisegundos
      console.error('Request timestamp too old:', timeDiff)
      return new Response(
        JSON.stringify({ error: 'Request timestamp too old' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Obtener y validar datos del formulario
    const formData = await req.formData()
    
    // Validar que hay datos en el formulario
    if (!formData || formData.entries().next().done) {
      console.error('Empty form data received')
      return new Response(
        JSON.stringify({ error: 'No form data received' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Obtener el archivo subido
    const file = formData.get('file') as File
    if (!file) {
      console.error('No file provided')
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validar archivos subidos
    if (file.size > 10 * 1024 * 1024) { // Límite de 10MB
      console.error('File too large:', file.size)
      return new Response(
        JSON.stringify({ error: 'File too large (max 10MB)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Validar tipos de archivos permitidos
    const allowedTypes = ['text/csv', 'application/json', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      return new Response(
        JSON.stringify({ error: 'Invalid file type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // URL del webhook
    const WEBHOOK_URL = 'https://n8n-n8n.mdrxie.easypanel.host/webhook/1a11d6d5-d3bb-4b71-815d-e3bd8b87d118'
    
    console.log('Preparing to send data to webhook...')
    console.log('Hotel ID:', hotelId)
    console.log('File name:', file.name)
    console.log('File size:', file.size)

    // Crear FormData para el webhook
    const webhookData = new FormData()
    webhookData.append('file', file)
    webhookData.append('hotelId', sanitizeInput(hotelId))
    webhookData.append('timestamp', sanitizeInput(timestamp))
    webhookData.append('source', 'lovable-app')

    // Enviar solicitud al webhook con timeout de seguridad
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: webhookData,
      headers: {
        'X-Hotel-ID': sanitizeInput(hotelId),
        'X-Timestamp': sanitizeInput(timestamp),
        'X-Source': 'lovable-app'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('Webhook response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Webhook error response:', errorText.substring(0, 200))
      return new Response(
        JSON.stringify({ 
          error: 'Error processing file with external service',
          details: response.status === 404 ? 'Service not available' : 'Processing failed'
        }),
        { 
          status: 422, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result = await response.text()
    console.log('Webhook success response received')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Menu import request processed successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in menu import:', error)
    
    // Proporcionar detalles más específicos del error
    let publicErrorMessage = 'Failed to process menu import'
    
    if (error.name === 'AbortError') {
      publicErrorMessage = 'Request timeout - the service is taking too long to respond'
    } else if (error.message?.includes('fetch')) {
      publicErrorMessage = 'Network error - unable to connect to processing service'
    } else if (error.message?.includes('TypeError')) {
      publicErrorMessage = 'Invalid data format'
    }
    
    return new Response(
      JSON.stringify({ 
        error: publicErrorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
