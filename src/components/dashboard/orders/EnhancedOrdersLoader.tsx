
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
    if (!hotelId) return;
    
    loadOrders();
  }, [hotelId]);

  const loadOrders = async () => {
    try {
      onLoadingChange(true);
      
      // Verificar autenticación primero
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error de autenticación:', authError);
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
        return;
      }

      console.log('📋 Pedidos encontrados:', ordersData?.length || 0);

      if (ordersData && ordersData.length > 0) {
        // Cargar items para cada pedido
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
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
            
            return formatOrderFromDatabase(order, validItems);
          })
        );
        
        const validOrders = ordersWithItems.filter(order => 
          order.items && order.items.trim() !== ''
        );
        
        onOrdersLoaded(validOrders);
      } else {
        onOrdersLoaded([]);
      }

      // Cargar estadísticas del día
      await loadDayStatistics();

    } catch (error) {
      console.error('Error general cargando pedidos:', error);
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

      // Cargar pedidos del día para estadísticas
      const { data: todayOrders, error: statsError } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (statsError) {
        console.error('Error cargando estadísticas:', statsError);
        return;
      }

      // Cargar información de elementos del menú
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('available');

      if (menuError) {
        console.error('Error cargando elementos del menú:', menuError);
      }

      const completedOrders = todayOrders?.filter(o => o.status === 'completado') || [];
      const availableItems = menuItems?.filter(item => item.available) || [];
      const totalItems = menuItems?.length || 0;

      const stats: DayStats = {
        totalFinalizados: completedOrders.length,
        ventasDelDia: completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0),
        platosDisponibles: availableItems.length,
        totalPlatos: totalItems
      };

      console.log('📊 Estadísticas calculadas:', stats);
      onDayStatsLoaded(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  return null;
};

export default EnhancedOrdersLoader;
