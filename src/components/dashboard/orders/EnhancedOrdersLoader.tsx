
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Order, DayStats } from "./types";
import { formatOrderFromDatabase } from "./orderUtils";

interface EnhancedOrdersLoaderProps {
  hotelId: string;
  onOrdersLoaded: (orders: Order[]) => void;
  onDayStatsLoaded: (stats: DayStats) => void;
  onLoadingChange: (loading: boolean) => void;
}

const EnhancedOrdersLoader = ({ 
  hotelId, 
  onOrdersLoaded, 
  onDayStatsLoaded, 
  onLoadingChange 
}: EnhancedOrdersLoaderProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!hotelId) {
      console.log("⚠️ No hay hotelId disponible");
      return;
    }
    
    loadOrders();
  }, [hotelId]);

  const loadOrders = async () => {
    try {
      onLoadingChange(true);
      console.log('🔄 Cargando pedidos para hotel:', hotelId);
      
      // Cargar pedidos
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Error cargando pedidos:', ordersError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los pedidos",
          variant: "destructive"
        });
        onOrdersLoaded([]);
        return;
      }

      console.log('📋 Pedidos encontrados:', ordersData?.length || 0);

      if (ordersData && ordersData.length > 0) {
        // Cargar items para cada pedido
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            const { data: orderItems } = await supabase
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
              .eq('order_id', order.id);
            
            const validItems = orderItems?.filter(item => 
              item.menu_items && 
              typeof item.menu_items === 'object' && 
              'name' in item.menu_items
            ) || [];
            
            return formatOrderFromDatabase(order, validItems);
          })
        );
        
        const validOrders = ordersWithItems.filter(order => 
          order.items && order.items.trim() !== '' && order.items !== 'Sin items disponibles'
        );
        
        console.log('✅ Pedidos válidos:', validOrders.length);
        onOrdersLoaded(validOrders);
      } else {
        console.log('📭 No hay pedidos para este hotel');
        onOrdersLoaded([]);
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

      const completedOrders = todayOrders?.filter(o => o.status === 'completado') || [];
      const stats: DayStats = {
        totalFinalizados: completedOrders.length,
        ventasDelDia: completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0),
        platosDisponibles: 0,
        totalPlatos: 0
      };

      onDayStatsLoaded(stats);

    } catch (error) {
      console.error('❌ Error general:', error);
      toast({
        title: "Error",
        description: "Error cargando datos del dashboard",
        variant: "destructive"
      });
      onOrdersLoaded([]);
    } finally {
      onLoadingChange(false);
    }
  };

  return null;
};

export default EnhancedOrdersLoader;
