
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipeId, hotelId } = await req.json();
    
    console.log('Sending recipe to webhook:', { recipeId, hotelId });

    // Use the n8n webhook URL directly
    const webhookUrl = 'https://n8n-n8n.mdrxie.easypanel.host/webhook/bef5925b-45d4-4f5d-a3ab-eb59afb62659';

    // Send simplified data to n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'recipe_request',
        recipeId: recipeId,
        hotelId: hotelId,
        timestamp: new Date().toISOString()
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`N8N Webhook failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
    }

    const result = await webhookResponse.json().catch(() => ({}));

    console.log('Recipe request sent successfully to n8n webhook');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Solicitud de escandallo enviada correctamente a n8n',
        webhookResponse: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-recipe function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
