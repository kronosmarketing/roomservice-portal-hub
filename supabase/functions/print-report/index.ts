
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const printWebhookUrl = Deno.env.get('PRINT_WEBHOOK_URL');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar variables de entorno críticas
    if (!printWebhookUrl) {
      console.error('❌ PRINT_WEBHOOK_URL no está configurado');
      throw new Error('PRINT_WEBHOOK_URL no está configurado en las variables de entorno');
    }

    console.log('🌐 Print webhook URL configurado:', printWebhookUrl);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parsing robusto del JSON
    let requestBody;
    try {
      const rawBody = await req.text();
      console.log('📥 Raw request body:', rawBody);
      requestBody = JSON.parse(rawBody);
      console.log('📋 Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { type, hotel_id, order_id, ...otherData } = requestBody;

    console.log('📤 Procesando solicitud:', { type, hotel_id, order_id });

    // Validar campos requeridos
    if (!type || !hotel_id) {
      console.error('❌ Campos requeridos faltantes:', { type, hotel_id });
      throw new Error('Missing required fields: type and hotel_id');
    }

    // Obtener nombre del hotel
    const { data: hotelData } = await supabase
      .from('hotel_user_settings')
      .select('hotel_name')
      .eq('id', hotel_id)
      .single();

    const hotelName = hotelData?.hotel_name || '';
    console.log('🏨 Hotel name:', hotelName);

    // Preparar payload del webhook según el tipo
    let webhookPayload;
    const currentTime = new Date();
    const fechaFormateada = currentTime.toLocaleDateString('es-ES');
    const horaFormateada = currentTime.toLocaleString('es-ES');

    switch (type) {
      case 'order_print':
        const orderData = requestBody.data || {};
        webhookPayload = {
          hotel_id,
          report_type: 'pedido_individual',
          report_data: {
            fecha: fechaFormateada,
            hora: horaFormateada,
            hotel_name: hotelName,
            order_id: order_id || '',
            room_number: orderData.room_number || '',
            items: orderData.items || '',
            total: parseFloat(orderData.total || '0'),
            status: orderData.status || '',
            payment_method: orderData.payment_method || 'habitacion',
            special_instructions: orderData.special_instructions || '',
            timestamp: orderData.timestamp || fechaFormateada
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
            totalPedidos: requestBody.total_pedidos || 0,
            pedidosCompletados: requestBody.pedidos_completados || 0,
            pedidosCancelados: requestBody.pedidos_cancelados || 0,
            pedidosEliminados: 0,
            totalDinero: parseFloat(requestBody.total_dinero || '0'),
            metodosDetalle: requestBody.metodos_pago || {}
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
            totalPedidos: requestBody.totalPedidos || 0,
            pedidosCompletados: requestBody.pedidosCompletados || 0,
            pedidosCancelados: requestBody.pedidosCancelados || 0,
            pedidosEliminados: 0,
            totalDinero: parseFloat(requestBody.totalDinero || '0'),
            metodosDetalle: requestBody.metodosDetalle || {}
          }
        };
        break;

      default:
        console.error('❌ Tipo de reporte no soportado:', type);
        throw new Error(`Tipo de reporte no soportado: ${type}`);
    }

    console.log('📄 Payload preparado para webhook:', JSON.stringify(webhookPayload, null, 2));

    // Enviar al webhook con manejo de errores mejorado
    console.log('🌐 Enviando al webhook:', printWebhookUrl);
    
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
      console.error('❌ Error en respuesta del webhook:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        body: responseText
      });
      throw new Error(`Webhook error: ${webhookResponse.status} - ${responseText}`);
    }

    console.log('✅ Datos enviados al webhook correctamente');

    // Log de auditoría de seguridad
    await supabase.from('security_audit_log').insert({
      user_id: null,
      hotel_id,
      action: 'print_webhook_sent',
      resource_type: 'print',
      resource_id: order_id,
      details: {
        type,
        webhook_sent: true,
        timestamp: new Date().toISOString(),
        payload_structure: Object.keys(webhookPayload)
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        webhook_sent: true,
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
