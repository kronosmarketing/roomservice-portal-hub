
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookUrl = Deno.env.get('MENU_IMPORT_WEBHOOK_URL'); // Using existing webhook URL

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { type, hotel_id, order_id, data } = await req.json();

    console.log('📤 Enviando al webhook:', { type, hotel_id, order_id });

    // Validate required fields
    if (!type || !hotel_id) {
      throw new Error('Missing required fields: type and hotel_id');
    }

    // Get hotel name for context
    const { data: hotelData } = await supabase
      .from('hotel_user_settings')
      .select('hotel_name')
      .eq('id', hotel_id)
      .single();

    // Prepare webhook payload
    const webhookPayload = {
      type,
      hotel_id,
      hotel_name: hotelData?.hotel_name || 'Hotel desconocido',
      order_id: order_id || null,
      timestamp: new Date().toISOString(),
      data: data || {}
    };

    // Send to webhook if URL is configured
    if (webhookUrl) {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        console.error('❌ Error webhook response:', webhookResponse.status);
      } else {
        console.log('✅ Webhook enviado correctamente');
      }
    } else {
      console.log('⚠️ Webhook URL no configurado');
    }

    // Log the action for security audit
    await supabase.from('security_audit_log').insert({
      user_id: null,
      hotel_id,
      action: 'print_webhook_sent',
      resource_type: 'print',
      resource_id: order_id,
      details: {
        type,
        webhook_sent: !!webhookUrl,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        webhook_sent: !!webhookUrl,
        message: 'Print webhook processed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error en print-report function:', error);
    
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
