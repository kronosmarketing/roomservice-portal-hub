
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "./types";
import { formatOrderFromDatabase } from "./orderUtils";
import { validateUserHotelAccess, logSecurityEvent, verifyAuthentication } from "./securityUtils";

interface EnhancedOrdersRealtimeProps {
  hotelId: string;
  onNewOrder: (order: Order) => void;
}

const EnhancedOrdersRealtime = ({ hotelId, onNewOrder }: EnhancedOrdersRealtimeProps) => {
  useEffect(() => {
    if (!hotelId) return;

    console.log('🔄 Configurando tiempo real seguro para hotel:', hotelId);

    const setupSecureRealtime = async () => {
      // Verificar autenticación antes de configurar tiempo real
      const isAuthenticated = await verifyAuthentication();
      if (!isAuthenticated) {
        console.error('❌ No se puede configurar tiempo real sin autenticación');
        await logSecurityEvent('unauthenticated_realtime_setup_attempt', 'realtime', hotelId);
        return;
      }

      // Validar acceso al hotel
      const hasAccess = await validateUserHotelAccess(hotelId);
      if (!hasAccess) {
        console.error('❌ No se puede configurar tiempo real sin acceso al hotel');
        await logSecurityEvent('unauthorized_realtime_setup_attempt', 'realtime', hotelId);
        return;
      }

      await logSecurityEvent('realtime_setup_initiated', 'realtime', hotelId);

      const channel = supabase
        .channel(`secure-orders-${hotelId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `hotel_id=eq.${hotelId}`
          },
          async (payload) => {
            console.log('📥 Nuevo pedido detectado (seguro):', payload);
            
            // Validación adicional del payload
            if (!payload.new || !payload.new.id) {
              console.log('⚠️ Payload inválido ignorado');
              return;
            }

            // Las RLS policies ya garantizan que solo recibimos pedidos del hotel correcto
            try {
              // Cargar los items del pedido
              const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                  id,
                  quantity,
                  unit_price,
                  total_price,
                  special_instructions,
                  menu_items!order_items_menu_item_id_fkey (
                    id,
                    name,
                    price,
                    available
                  )
                `)
                .eq('order_id', payload.new.id);

              if (itemsError) {
                console.error('Error cargando items del nuevo pedido:', itemsError);
                await logSecurityEvent('realtime_order_items_error', 'orders', payload.new.id, {
                  error: itemsError.message
                });
                return;
              }

              const validItems = orderItems?.filter(item => 
                item.menu_items && 
                typeof item.menu_items === 'object' && 
                'name' in item.menu_items
              ) || [];

              if (validItems.length === 0) {
                console.log('⚠️ Nuevo pedido ignorado: no tiene items válidos');
                return;
              }

              const formattedOrder = formatOrderFromDatabase(payload.new, validItems);
              
              if (formattedOrder.items && formattedOrder.items.trim() !== '') {
                console.log(`✅ Procesando nuevo pedido seguro: ${formattedOrder.id.substring(0, 8)}`);
                await logSecurityEvent('realtime_order_received', 'orders', formattedOrder.id);
                onNewOrder(formattedOrder);
              } else {
                console.log('⚠️ Nuevo pedido ignorado: no tiene items válidos después del formateo');
              }
            } catch (error) {
              console.error('Error procesando nuevo pedido:', error);
              await logSecurityEvent('realtime_order_processing_error', 'orders', payload.new.id, {
                error: String(error)
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('🔌 Estado del canal tiempo real seguro:', status);
          if (status === 'SUBSCRIBED') {
            logSecurityEvent('realtime_subscribed', 'realtime', hotelId);
          } else if (status === 'CLOSED') {
            logSecurityEvent('realtime_disconnected', 'realtime', hotelId);
          }
        });

      return channel;
    };

    let channel: any;
    
    setupSecureRealtime().then((ch) => {
      channel = ch;
    }).catch((error) => {
      console.error('Error configurando tiempo real seguro:', error);
      logSecurityEvent('realtime_setup_error', 'realtime', hotelId, {
        error: String(error)
      });
    });

    return () => {
      if (channel) {
        console.log('🔌 Desconectando tiempo real seguro');
        logSecurityEvent('realtime_cleanup', 'realtime', hotelId);
        supabase.removeChannel(channel);
      }
    };
  }, [hotelId, onNewOrder]);

  return null;
};

export default EnhancedOrdersRealtime;
