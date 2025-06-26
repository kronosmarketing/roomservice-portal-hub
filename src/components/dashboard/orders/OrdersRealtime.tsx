
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "./types";
import { formatOrderFromDatabase } from "./orderUtils";

interface OrdersRealtimeProps {
  hotelId: string;
  onNewOrder: (order: Order) => void;
}

const OrdersRealtime = ({ hotelId, onNewOrder }: OrdersRealtimeProps) => {
  useEffect(() => {
    if (!hotelId) return;

    console.log('🔄 Configurando tiempo real para hotel:', hotelId);

    // Verificar autenticación antes de configurar tiempo real
    const setupRealtime = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ No se puede configurar tiempo real sin autenticación');
        return;
      }

      const channel = supabase
        .channel('orders-changes')
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
            if (!payload.new || payload.new.hotel_id !== hotelId) {
              console.log('⚠️ Pedido ignorado: no pertenece al hotel actual');
              return;
            }
            
            try {
              // Cargar los items del pedido con validación de seguridad
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
                return;
              }

              // Validar que los items existen y pertenecen al menú del hotel
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
              
              // Solo procesar si el pedido tiene contenido válido
              if (formattedOrder.items && formattedOrder.items.trim() !== '') {
                console.log(`✅ Procesando nuevo pedido: ${formattedOrder.id.substring(0, 8)}`);
                onNewOrder(formattedOrder);
              } else {
                console.log('⚠️ Nuevo pedido ignorado: no tiene items válidos después del formateo');
              }
            } catch (error) {
              console.error('Error procesando nuevo pedido:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('🔌 Estado del canal tiempo real:', status);
        });

      return channel;
    };

    let channel: any;
    
    setupRealtime().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) {
        console.log('🔌 Desconectando tiempo real');
        supabase.removeChannel(channel);
      }
    };
  }, [hotelId, onNewOrder]);

  return null;
};

export default OrdersRealtime;
