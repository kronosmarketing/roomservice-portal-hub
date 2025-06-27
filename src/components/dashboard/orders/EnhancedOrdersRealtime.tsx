
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "./types";
import { formatOrderFromDatabase } from "./orderUtils";
import { logSecurityEvent } from "./securityUtils";

interface EnhancedOrdersRealtimeProps {
  hotelId: string;
  onNewOrder: (order: Order) => void;
}

const EnhancedOrdersRealtime = ({ hotelId, onNewOrder }: EnhancedOrdersRealtimeProps) => {
  useEffect(() => {
    if (!hotelId) return;

    console.log('🔄 Configurando tiempo real seguro para hotel:', hotelId);

    const setupRealtime = async () => {
      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ No se puede configurar tiempo real sin autenticación');
        await logSecurityEvent('realtime_setup_auth_failed', 'orders', hotelId);
        return;
      }

      // Obtener el hotel_id correcto del usuario
      const { data: userSettings, error: settingsError } = await supabase
        .from('hotel_user_settings')
        .select('id')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();

      if (settingsError || !userSettings) {
        console.error('❌ Error obteniendo configuración para tiempo real:', settingsError);
        return;
      }

      const actualHotelId = userSettings.id;
      console.log('🔌 Configurando tiempo real para hotel ID:', actualHotelId);

      const channel = supabase
        .channel('secure-orders-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders'
          },
          async (payload) => {
            console.log('📥 Nuevo pedido detectado:', payload);
            
            // Validar que el pedido pertenece al hotel del usuario actual
            if (!payload.new || payload.new.hotel_id !== actualHotelId) {
              console.log('⚠️ Pedido ignorado: no pertenece al hotel actual');
              await logSecurityEvent('realtime_order_rejected', 'orders', payload.new?.id || 'unknown', {
                reason: 'hotel_mismatch',
                expected_hotel: actualHotelId,
                received_hotel: payload.new?.hotel_id
              });
              return;
            }
            
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
                console.error('❌ Error cargando items del nuevo pedido:', itemsError);
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

              console.log(`📦 Items válidos en nuevo pedido:`, validItems.length);

              const formattedOrder = formatOrderFromDatabase(payload.new, validItems);
              
              if (formattedOrder.items && formattedOrder.items.trim() !== '' && formattedOrder.items !== 'Sin items disponibles') {
                console.log(`✅ Procesando nuevo pedido: ${formattedOrder.id.substring(0, 8)}`);
                await logSecurityEvent('realtime_order_processed', 'orders', formattedOrder.id);
                onNewOrder(formattedOrder);
              } else {
                console.log('⚠️ Nuevo pedido ignorado: no tiene items válidos después del formateo');
              }
            } catch (error) {
              console.error('❌ Error procesando nuevo pedido:', error);
              await logSecurityEvent('realtime_order_processing_error', 'orders', payload.new?.id || 'unknown', {
                error: String(error)
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('🔌 Estado del canal tiempo real:', status);
          if (status === 'SUBSCRIBED') {
            logSecurityEvent('realtime_channel_subscribed', 'orders', actualHotelId);
          }
        });

      return channel;
    };

    let channel: any;
    
    setupRealtime().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) {
        console.log('🔌 Desconectando tiempo real seguro');
        logSecurityEvent('realtime_channel_disconnected', 'orders', hotelId);
        supabase.removeChannel(channel);
      }
    };
  }, [hotelId, onNewOrder]);

  return null;
};

export default EnhancedOrdersRealtime;
