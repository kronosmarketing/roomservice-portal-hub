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
    console.log('🔄 Iniciando función print-report');
    
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
      
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(rawBody);
      console.log('📋 Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { type, report_type, hotel_id, order_id, ...otherData } = requestBody;
    const effectiveType = report_type || type; // Use report_type if available, fallback to type

    console.log('📤 Procesando solicitud:', { type, report_type, effectiveType, hotel_id, order_id });

    // Validar campos requeridos
    if (!effectiveType || !hotel_id) {
      console.error('❌ Campos requeridos faltantes:', { type: effectiveType, hotel_id });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: type/report_type and hotel_id',
          received: { type: effectiveType, hotel_id }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Obtener nombre del hotel con manejo de errores
    let hotelName = '';
    try {
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotel_user_settings')
        .select('hotel_name')
        .eq('id', hotel_id)
        .single();

      if (hotelError) {
        console.error('❌ Error obteniendo hotel:', hotelError);
        hotelName = 'Hotel Desconocido';
      } else {
        hotelName = hotelData?.hotel_name || 'Hotel Desconocido';
      }
    } catch (hotelFetchError) {
      console.error('❌ Error crítico obteniendo hotel:', hotelFetchError);
      hotelName = 'Hotel Desconocido';
    }

    console.log('🏨 Hotel name:', hotelName);

    // Preparar payload del webhook según el tipo
    let webhookPayload;
    const currentTime = new Date();
    const fechaFormateada = currentTime.toLocaleDateString('es-ES');
    const horaFormateada = currentTime.toLocaleString('es-ES');

    switch (effectiveType) {
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
            totalPedidos: parseInt(requestBody.total_pedidos || '0'),
            pedidosCompletados: parseInt(requestBody.pedidos_completados || '0'),
            pedidosCancelados: parseInt(requestBody.pedidos_cancelados || '0'),
            pedidosEliminados: parseInt(requestBody.pedidos_eliminados || '0'),
            totalDinero: parseFloat(requestBody.total_dinero || '0'),
            metodosDetalle: requestBody.metodosDetalle || {}
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
            totalPedidos: parseInt(requestBody.totalPedidos || '0'),
            pedidosCompletados: parseInt(requestBody.pedidosCompletados || '0'),
            pedidosCancelados: parseInt(requestBody.pedidosCancelados || '0'),
            pedidosEliminados: parseInt(requestBody.pedidosEliminados || '0'),
            totalDinero: parseFloat(requestBody.totalDinero || '0'),
            metodosDetalle: requestBody.metodosDetalle || {}
          }
        };
        break;

      case 'reprintClosure':
        webhookPayload = {
          hotel_id,
          report_type: 'reprintClosure',
          report_data: {
            fecha: requestBody.fecha || fechaFormateada, // Use specific date if provided
            hora: horaFormateada,
            hotel_name: hotelName,
            totalPedidos: parseInt(requestBody.totalPedidos || '0'),
            pedidosCompletados: parseInt(requestBody.pedidosCompletados || '0'),
            pedidosCancelados: parseInt(requestBody.pedidosCancelados || '0'),
            pedidosEliminados: parseInt(requestBody.pedidosEliminados || '0'),
            totalDinero: parseFloat(requestBody.totalDinero || '0'),
            metodosDetalle: requestBody.metodosDetalle || {}
          }
        };
        break;

      default:
        console.error('❌ Tipo de reporte no soportado:', effectiveType);
        return new Response(
          JSON.stringify({ 
            error: `Tipo de reporte no soportado: ${effectiveType}`,
            supported_types: ['order_print', 'daily_report_x', 'closure_z', 'reprintClosure']
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
    }

    console.log('📄 Payload preparado para webhook:', JSON.stringify(webhookPayload, null, 2));

    // Enviar al webhook con manejo de errores mejorado
    console.log('🌐 Enviando al webhook:', printWebhookUrl);
    
    try {
      const webhookResponse = await fetch(printWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0',
        },
        body: JSON.stringify(webhookPayload),
      });

      const responseText = await webhookResponse.text();
      console.log('📨 Respuesta del webhook:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        headers: Object.fromEntries(webhookResponse.headers.entries()),
        body: responseText
      });

      if (!webhookResponse.ok) {
        console.error('❌ Error en respuesta del webhook:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          body: responseText
        });
        
        return new Response(
          JSON.stringify({ 
            error: `Webhook error: ${webhookResponse.status} - ${webhookResponse.statusText}`,
            webhook_response: responseText,
            webhook_url: printWebhookUrl
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 502,
          }
        );
      }

      console.log('✅ Datos enviados al webhook correctamente');

      // Log de auditoría de seguridad
      try {
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
      } catch (auditError) {
        console.error('⚠️ Error en log de auditoría (no crítico):', auditError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          webhook_sent: true,
          message: 'Print webhook processed successfully',
          webhook_url: printWebhookUrl,
          payload_sent: webhookPayload
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (webhookError) {
      console.error('❌ Error crítico enviando al webhook:', webhookError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send data to webhook',
          details: webhookError.message,
          webhook_url: printWebhookUrl
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 502,
        }
      );
    }

  } catch (error) {
    console.error('❌ Error crítico en print-report function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: 'Check function logs for more information',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
