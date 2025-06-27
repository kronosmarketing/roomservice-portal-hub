
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
      console.log('🔄 Cargando pedidos...');

      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error de autenticación:', authError);
        onOrdersLoaded([]);
        onDayStatsLoaded({
          totalFinalizados: 0,
          ventasDelDia: 0,
          platosDisponibles: 0,
          totalPlatos: 0
        });
        return;
      }

      console.log('Usuario autenticado:', user.email);

      // Cargar pedidos - RLS se encarga del filtrado automáticamente
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error cargando pedidos:', ordersError);
        onOrdersLoaded([]);
        onDayStatsLoaded({
          totalFinalizados: 0,
          ventasDelDia: 0,
          platosDisponibles: 0,
          totalPlatos: 0
        });
        return;
      }

      console.log('📋 Pedidos encontrados:', ordersData?.length || 0);

      if (ordersData && ordersData.length > 0) {
        // Cargar items para cada pedido
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            console.log(`🔍 Cargando items para pedido ${order.id.substring(0, 8)}`);
            
            try {
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
                .eq('order_id', order.id);
              
              if (itemsError) {
                console.error(`Error cargando items para pedido ${order.id}:`, itemsError);
                return formatOrderFromDatabase(order, []);
              }
              
              const validItems = orderItems?.filter(item => 
                item.menu_items && 
                typeof item.menu_items === 'object' && 
                'name' in item.menu_items
              ) || [];
              
              console.log(`📦 Items válidos encontrados para ${order.id.substring(0, 8)}:`, validItems.length);
              
              return formatOrderFromDatabase(order, validItems);
            } catch (error) {
              console.error(`Error procesando pedido ${order.id}:`, error);
              return formatOrderFromDatabase(order, []);
            }
          })
        );
        
        console.log('🍽️ Pedidos con items formateados:', ordersWithItems.length);
        onOrdersLoaded(ordersWithItems);
      } else {
        console.log('📭 No se encontraron pedidos para este usuario');
        onOrdersLoaded([]);
      }

      // Cargar estadísticas del día
      await loadDayStatistics();

    } catch (error) {
      console.error('Error general cargando pedidos:', error);
      onOrdersLoaded([]);
      onDayStatsLoaded({
        totalFinalizados: 0,
        ventasDelDia: 0,
        platosDisponibles: 0,
        totalPlatos: 0
      });
    } finally {
      onLoadingChange(false);
    }
  };

  const loadDayStatistics = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // RLS se encarga del filtrado automáticamente
      const { data: todayOrders, error: statsError } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (statsError) {
        console.error('Error cargando estadísticas:', statsError);
      }

      const completedOrders = todayOrders?.filter(o => o.status === 'completado') || [];
      const stats: DayStats = {
        totalFinalizados: completedOrders.length,
        ventasDelDia: completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0),
        platosDisponibles: 0,
        totalPlatos: 0
      };

      onDayStatsLoaded(stats);
    } catch (statsError) {
      console.error('Error cargando estadísticas:', statsError);
      onDayStatsLoaded({
        totalFinalizados: 0,
        ventasDelDia: 0,
        platosDisponibles: 0,
        totalPlatos: 0
      });
    }
  };

  return null;
};

export default OrdersLoader;
