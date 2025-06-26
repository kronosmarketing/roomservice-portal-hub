
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Order, DayStats } from "./types";
import { formatOrderFromDatabase } from "./orderUtils";

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

      // Cargar pedidos directamente desde la tabla orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error cargando pedidos:', ordersError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los pedidos",
          variant: "destructive"
        });
        return;
      }

      console.log('📋 Pedidos encontrados:', ordersData?.length || 0);

      if (ordersData && ordersData.length > 0) {
        // Cargar items para cada pedido usando la relación específica
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            console.log(`🔍 Cargando items para pedido ${order.id.substring(0, 8)}`);
            
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
                  price
                )
              `)
              .eq('order_id', order.id);
            
            if (itemsError) {
              console.error(`Error cargando items para pedido ${order.id}:`, itemsError);
              return formatOrderFromDatabase(order, []);
            }
            
            console.log(`📦 Items encontrados para ${order.id.substring(0, 8)}:`, orderItems?.length || 0);
            if (orderItems) {
              orderItems.forEach((item, index) => {
                console.log(`  Item ${index + 1}:`, item.menu_items?.name, `(${item.quantity}x)`);
              });
            }
            
            return formatOrderFromDatabase(order, orderItems || []);
          })
        );
        
        console.log('🍽️ Pedidos con items formateados:', ordersWithItems.length);
        
        // Log para verificar el resultado final
        ordersWithItems.forEach(order => {
          console.log(`✅ Pedido final ${order.id.substring(0, 8)}: "${order.items}"`);
        });
        
        onOrdersLoaded(ordersWithItems);
      } else {
        console.log('📭 No se encontraron pedidos para este hotel');
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
