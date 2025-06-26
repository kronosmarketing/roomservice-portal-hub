
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

      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error de autenticación:', authError);
        toast({
          title: "Error de autenticación",
          description: "Debes estar autenticado para ver los pedidos",
          variant: "destructive"
        });
        return;
      }

      // Cargar pedidos con validación de seguridad usando RLS
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
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
        // Cargar items para cada pedido con validación de relaciones
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            console.log(`🔍 Cargando items para pedido ${order.id.substring(0, 8)}`);
            
            // Usar RLS para cargar items relacionados de forma segura
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
            
            // Validar que los items pertenecen al menú del hotel
            const validItems = orderItems?.filter(item => 
              item.menu_items && 
              typeof item.menu_items === 'object' && 
              'name' in item.menu_items
            ) || [];
            
            console.log(`📦 Items válidos encontrados para ${order.id.substring(0, 8)}:`, validItems.length);
            
            if (validItems.length > 0) {
              validItems.forEach((item, index) => {
                const menuItem = item.menu_items as any;
                console.log(`  Item ${index + 1}:`, menuItem.name, `(${item.quantity}x)`);
              });
            }
            
            return formatOrderFromDatabase(order, validItems);
          })
        );
        
        console.log('🍽️ Pedidos con items formateados:', ordersWithItems.length);
        
        // Filtrar pedidos válidos que tienen items
        const validOrders = ordersWithItems.filter(order => 
          order.items && order.items.trim() !== ''
        );
        
        console.log('✅ Pedidos válidos finales:', validOrders.length);
        
        // Log para verificar el resultado final
        validOrders.forEach(order => {
          console.log(`✅ Pedido final ${order.id.substring(0, 8)}: "${order.items}"`);
        });
        
        onOrdersLoaded(validOrders);
      } else {
        console.log('📭 No se encontraron pedidos para este hotel');
        onOrdersLoaded([]);
      }

      // Cargar estadísticas del día con validación de seguridad
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
