
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const printWebhookUrl = Deno.env.get('PRINT_WEBHOOK_URL'); // Correct webhook URL for printing

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { type, hotel_id, order_id, data } = await req.json();

    console.log('📤 Enviando al webhook de impresión:', { type, hotel_id, order_id });

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

    const hotelName = hotelData?.hotel_name || '';

    // Prepare webhook payload with correct structure
    let webhookPayload;
    const currentTime = new Date();
    const fechaFormateada = currentTime.toLocaleDateString('es-ES');
    const horaFormateada = currentTime.toLocaleString('es-ES');

    switch (type) {
      case 'order_print':
        webhookPayload = {
          hotel_id,
          report_type: 'pedido_individual',
          report_data: {
            fecha: fechaFormateada,
            hora: horaFormateada,
            hotel_name: hotelName,
            order_id: order_id || '',
            room_number: data?.room_number || '',
            items: data?.items || '',
            total: parseFloat(data?.total || '0'),
            status: data?.status || '',
            payment_method: data?.payment_method || 'habitacion',
            special_instructions: data?.special_instructions || '',
            timestamp: data?.timestamp || fechaFormateada
          }
        };
        break;

      case 'daily_report_x':
        webhookPayload = {
          hotel_id,
          report_type: 'informe_x',
          report_data: {
            fecha: fechaFormateada,
            hora: horaFormateada,
            hotel_name: hotelName,
            totalPedidos: data?.total_pedidos || 0,
            pedidosCompletados: data?.pedidos_completados || 0,
            pedidosCancelados: data?.pedidos_cancelados || 0,
            pedidosEliminados: 0,
            totalDinero: parseFloat(data?.total_dinero || '0'),
            metodosDetalle: data?.metodos_pago || {}
          }
        };
        break;

      case 'closure_z':
        webhookPayload = {
          hotel_id,
          report_type: 'cierre_z',
          report_data: {
            fecha: fechaFormateada,
            hora: horaFormateada,
            hotel_name: hotelName,
            totalPedidos: data?.totalPedidos || 0,
            pedidosCompletados: data?.pedidosCompletados || 0,
            pedidosCancelados: data?.pedidosCancelados || 0,
            pedidosEliminados: 0,
            totalDinero: parseFloat(data?.totalDinero || '0'),
            metodosDetalle: data?.metodosDetalle || {}
          }
        };
        break;

      default:
        throw new Error(`Tipo de reporte no soportado: ${type}`);
    }

    console.log('📄 Payload preparado:', JSON.stringify(webhookPayload, null, 2));

    // Send to print webhook if URL is configured
    if (printWebhookUrl) {
      console.log('🌐 Enviando a webhook:', printWebhookUrl);
      
      const webhookResponse = await fetch(printWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      const responseText = await webhookResponse.text();
      console.log('📨 Respuesta del webhook:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        body: responseText
      });

      if (!webhookResponse.ok) {
        console.error('❌ Error webhook response:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          body: responseText
        });
        throw new Error(`Webhook error: ${webhookResponse.status} - ${responseText}`);
      } else {
        console.log('✅ Webhook enviado correctamente');
      }
    } else {
      console.log('⚠️ PRINT_WEBHOOK_URL no configurado');
      throw new Error('PRINT_WEBHOOK_URL no está configurado');
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
        webhook_sent: !!printWebhookUrl,
        timestamp: new Date().toISOString(),
        payload_structure: Object.keys(webhookPayload)
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        webhook_sent: !!printWebhookUrl,
        message: 'Print webhook processed successfully',
        payload_sent: webhookPayload
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
        success: false,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
