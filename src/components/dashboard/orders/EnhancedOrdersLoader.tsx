
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Order, DayStats } from "./types";
import { formatOrderFromDatabase } from "./orderUtils";
import { logSecurityEvent } from "./securityUtils";

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
      console.log('🔄 Iniciando carga segura de pedidos para hotel:', hotelId);
      
      // Verificar autenticación primero
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Error de autenticación:', authError);
        await logSecurityEvent('unauthenticated_orders_access_attempt', 'orders', hotelId);
        showGenericError('verificación de autenticación');
        return;
      }

      console.log('✅ Usuario autenticado:', user.email);

      // Obtener el hotel_id correcto del usuario autenticado
      const { data: userSettings, error: settingsError } = await supabase
        .from('hotel_user_settings')
        .select('id, hotel_name, is_active')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();

      if (settingsError || !userSettings) {
        console.error('❌ Error obteniendo configuración del usuario:', settingsError);
        await logSecurityEvent('user_settings_not_found', 'orders', hotelId);
        showGenericError('configuración de usuario');
        return;
      }

      const actualHotelId = userSettings.id;
      console.log('🏨 Hotel ID del usuario:', actualHotelId);
      console.log('🏨 Nombre del hotel:', userSettings.hotel_name);

      await logSecurityEvent('orders_load_initiated', 'orders', actualHotelId);

      // Cargar pedidos usando el hotel_id correcto
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('hotel_id', actualHotelId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Error cargando pedidos:', ordersError);
        await logSecurityEvent('orders_load_error', 'orders', actualHotelId, { error: ordersError.message });
        showGenericError('carga de pedidos');
        return;
      }

      console.log('📋 Pedidos encontrados:', ordersData?.length || 0);

      if (ordersData && ordersData.length > 0) {
        // Cargar items para cada pedido
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
                  price,
                  available
                )
              `)
              .eq('order_id', order.id);
            
            if (itemsError) {
              console.error(`❌ Error cargando items para pedido ${order.id}:`, itemsError);
              return formatOrderFromDatabase(order, []);
            }
            
            const validItems = orderItems?.filter(item => 
              item.menu_items && 
              typeof item.menu_items === 'object' && 
              'name' in item.menu_items
            ) || [];
            
            console.log(`📦 Items válidos encontrados para ${order.id.substring(0, 8)}:`, validItems.length);
            
            return formatOrderFromDatabase(order, validItems);
          })
        );
        
        const validOrders = ordersWithItems.filter(order => 
          order.items && order.items.trim() !== '' && order.items !== 'Sin items disponibles'
        );
        
        console.log('✅ Pedidos válidos finales:', validOrders.length);
        
        await logSecurityEvent('orders_loaded_successfully', 'orders', actualHotelId, { 
          count: validOrders.length 
        });
        
        onOrdersLoaded(validOrders);
      } else {
        console.log('📭 No se encontraron pedidos para este hotel');
        onOrdersLoaded([]);
      }

      // Cargar estadísticas del día
      await loadDayStatistics(actualHotelId);

    } catch (error) {
      console.error('❌ Error general cargando pedidos:', error);
      await logSecurityEvent('orders_load_exception', 'orders', hotelId, { 
        error: String(error) 
      });
      showGenericError('carga de datos');
    } finally {
      onLoadingChange(false);
    }
  };

  const loadDayStatistics = async (actualHotelId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayOrders, error: statsError } = await supabase
        .from('orders')
        .select('total, status')
        .eq('hotel_id', actualHotelId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (statsError) {
        console.error('❌ Error cargando estadísticas:', statsError);
        await logSecurityEvent('stats_load_error', 'orders', actualHotelId, { 
          error: statsError.message 
        });
        return;
      }

      const completedOrders = todayOrders?.filter(o => o.status === 'completado') || [];
      const stats: DayStats = {
        totalFinalizados: completedOrders.length,
        ventasDelDia: completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0),
        platosDisponibles: 0,
        totalPlatos: 0
      };

      console.log('📊 Estadísticas del día:', stats);
      onDayStatsLoaded(stats);
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      await logSecurityEvent('stats_load_exception', 'orders', actualHotelId, { 
        error: String(error) 
      });
    }
  };

  return null;
};

export default EnhancedOrdersLoader;
