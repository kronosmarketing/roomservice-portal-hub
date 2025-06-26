
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Order, DayStats } from "./types";
import { formatOrderFromDatabase } from "./orderUtils";
import { validateUserHotelAccess, logSecurityEvent, verifyAuthentication } from "./securityUtils";

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

  const showGenericError = (operation: string) => {
    toast({
      title: "Error",
      description: `No se pudo completar la operación: ${operation}`,
      variant: "destructive"
    });
  };

  const loadOrders = async () => {
    try {
      onLoadingChange(true);
      
      // Verificar autenticación primero
      const isAuthenticated = await verifyAuthentication();
      if (!isAuthenticated) {
        await logSecurityEvent('unauthenticated_orders_access_attempt', 'orders', hotelId);
        showGenericError('verificación de autenticación');
        return;
      }

      // Validar acceso al hotel
      const hasAccess = await validateUserHotelAccess(hotelId);
      if (!hasAccess) {
        await logSecurityEvent('unauthorized_orders_access_attempt', 'orders', hotelId);
        showGenericError('verificación de permisos');
        return;
      }

      await logSecurityEvent('orders_load_initiated', 'orders', hotelId);

      // Cargar pedidos usando RLS (las políticas ya filtran automáticamente)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error cargando pedidos:', ordersError);
        await logSecurityEvent('orders_load_error', 'orders', hotelId, { error: ordersError.message });
        showGenericError('carga de pedidos');
        return;
      }

      console.log('📋 Pedidos encontrados:', ordersData?.length || 0);

      if (ordersData && ordersData.length > 0) {
        // Cargar items para cada pedido
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            // Los items también están protegidos por RLS
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
        
        await logSecurityEvent('orders_loaded_successfully', 'orders', hotelId, { 
          count: validOrders.length 
        });
        
        onOrdersLoaded(validOrders);
      } else {
        onOrdersLoaded([]);
      }

      // Cargar estadísticas del día
      await loadDayStatistics(hotelId);

    } catch (error) {
      console.error('Error general cargando pedidos:', error);
      await logSecurityEvent('orders_load_exception', 'orders', hotelId, { 
        error: String(error) 
      });
      showGenericError('carga de datos');
    } finally {
      onLoadingChange(false);
    }
  };

  const loadDayStatistics = async (hotelId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayOrders, error: statsError } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (statsError) {
        console.error('Error cargando estadísticas:', statsError);
        await logSecurityEvent('stats_load_error', 'orders', hotelId, { 
          error: statsError.message 
        });
        // No mostrar error al usuario para estadísticas
        return;
      }

      const completedOrders = todayOrders?.filter(o => o.status === 'completado') || [];
      const stats: DayStats = {
        totalFinalizados: completedOrders.length,
        ventasDelDia: completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0),
        platosDisponibles: 0,
        totalPlatos: 0
      };

      onDayStatsLoaded(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      await logSecurityEvent('stats_load_exception', 'orders', hotelId, { 
        error: String(error) 
      });
    }
  };

  return null;
};

export default EnhancedOrdersLoader;
