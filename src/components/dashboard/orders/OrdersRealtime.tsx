
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

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `hotel_id=eq.${hotelId}`
        },
        async (payload) => {
          console.log('📥 Nuevo pedido detectado:', payload);
          
          // Cargar los items del pedido con los nombres de los platos
          const { data: orderItems } = await supabase
            .from('order_items')
            .select(`
              id,
              quantity,
              menu_item:menu_items (
                id,
                name,
                price
              )
            `)
            .eq('order_id', payload.new.id);

          const formattedOrder = formatOrderFromDatabase(payload.new, orderItems || []);
          onNewOrder(formattedOrder);
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando tiempo real');
      supabase.removeChannel(channel);
    };
  }, [hotelId, onNewOrder]);

  return null;
};

export default OrdersRealtime;
