
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Order, DayStats } from "./types";
import { formatOrderFromDatabase, formatOrderFromOrdersWithItems } from "./orderUtils";

interface OrdersLoaderProps {
  hotelId: string;
  onOrdersLoaded: (orders: Order[]) => void;
  onDayStatsLoaded: (stats: DayStats) => void;
  onLoadingChange: (loading: boolean) => void;
}

const OrdersLoader = ({ hotelId, onOrdersLoaded, onDayStatsLoaded, onLoadingChange }: OrdersLoaderProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!hotelId) return;
    
    loadOrders();
  }, [hotelId]);

  const loadOrders = async () => {
    try {
      onLoadingChange(true);
      console.log('🔄 Cargando pedidos para hotel:', hotelId);

      // Intentar cargar desde la vista orders_with_items primero
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders_with_items')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error cargando desde orders_with_items:', ordersError);
        
        // Fallback: cargar desde orders normal
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .select('*')
          .eq('hotel_id', hotelId)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          console.error('Error cargando pedidos:', fallbackError);
          toast({
            title: "Error",
            description: "No se pudieron cargar los pedidos",
            variant: "destructive"
          });
          return;
        }

        if (fallbackData) {
          console.log('📋 Pedidos cargados (fallback):', fallbackData.length);
          
          // Cargar items para cada pedido
          const ordersWithItems = await Promise.all(
            fallbackData.map(async (order) => {
              const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                  id,
                  quantity,
                  menu_item:menu_item_id (
                    id,
                    name,
                    price
                  )
                `)
                .eq('order_id', order.id);
              
              return formatOrderFromDatabase(order, orderItems || []);
            })
          );
          
          onOrdersLoaded(ordersWithItems);
        }
      } else {
        console.log('📋 Pedidos cargados desde vista:', ordersData?.length || 0);
        const formattedOrders = ordersData?.map(formatOrderFromOrdersWithItems) || [];
        onOrdersLoaded(formattedOrders);
      }

      // Cargar estadísticas del día
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total, status')
        .eq('hotel_id', hotelId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      const stats: DayStats = {
        totalFinalizados: todayOrders?.filter(o => o.status === 'entregado').length || 0,
        ventasDelDia: todayOrders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0,
        platosDisponibles: 0,
        totalPlatos: 0
      };

      onDayStatsLoaded(stats);

    } catch (error) {
      console.error('Error general cargando pedidos:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar pedidos",
        variant: "destructive"
      });
    } finally {
      onLoadingChange(false);
    }
  };

  return null;
};

export default OrdersLoader;
