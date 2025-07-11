
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Order, DayStats } from "../types";
import { ClosureData } from "./types";
import { 
  generateClosureData, 
  saveDailyClosure, 
  sendClosureToWebhook, 
  reprintClosure 
} from "./closureUtils";
import { printClosureReport, downloadExtract } from "./printUtils";

interface UseDayClosureProps {
  hotelId: string;
  hotelName: string;
  onOrdersChange: (orders: Order[]) => void;
  onDayStatsChange: (stats: DayStats) => void;
}

export const useDayClosure = ({ 
  hotelId, 
  hotelName, 
  onOrdersChange, 
  onDayStatsChange 
}: UseDayClosureProps) => {
  const [loading, setLoading] = useState(false);
  const [closureData, setClosureData] = useState<ClosureData | null>(null);
  const { toast } = useToast();

  const performDayClosure = useCallback(async () => {
    if (!hotelId) return;
    
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log('🔄 Iniciando cierre Z del día para hotel:', hotelId);

      // Get finished orders
      const { data: finishedOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('hotel_id', hotelId)
        .in('status', ['completado', 'cancelado'])
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (ordersError) {
        throw ordersError;
      }

      // Get deleted orders count
      const { data: deletedOrdersLog, error: deletedError } = await supabase
        .from('security_audit_log')
        .select('created_at')
        .eq('hotel_id', hotelId)
        .eq('action', 'delete_order')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (deletedError) {
        console.error('Error obteniendo pedidos eliminados:', deletedError);
      }

      const deletedOrdersCount = deletedOrdersLog?.length || 0;

      if (!finishedOrders || finishedOrders.length === 0) {
        toast({
          title: "Sin pedidos para cerrar",
          description: "No hay pedidos completados o cancelados para archivar",
          variant: "destructive"
        });
        return;
      }

      console.log('📋 Pedidos a archivar:', finishedOrders.length);
      console.log('🗑️ Pedidos eliminados del día:', deletedOrdersCount);

      const completedOrders = finishedOrders.filter(order => order.status === 'completado');
      const cancelledOrders = finishedOrders.filter(order => order.status === 'cancelado');
      const totalDinero = completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
      
      const metodosDetalle = completedOrders.reduce((acc, order) => {
        const metodo = order.payment_method || 'habitacion';
        if (!acc[metodo]) {
          acc[metodo] = { cantidad: 0, total: 0 };
        }
        acc[metodo].cantidad += 1;
        acc[metodo].total += parseFloat(order.total.toString());
        return acc;
      }, {} as Record<string, { cantidad: number; total: number }>);

      // Save to database
      await saveDailyClosure(
        hotelId, 
        finishedOrders, 
        completedOrders, 
        cancelledOrders, 
        deletedOrdersCount, 
        totalDinero, 
        metodosDetalle
      );

      // Generate closure data
      const closureInfo = generateClosureData(
        completedOrders,
        cancelledOrders,
        deletedOrdersCount,
        hotelName
      );

      console.log('📄 Datos del Cierre Z preparados:', closureInfo);

      // Archive orders
      const archivePromises = finishedOrders.map(async (order) => {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select(`
            id,
            quantity,
            unit_price,
            total_price,
            special_instructions,
            menu_items!menu_item_id (
              id,
              name,
              price
            )
          `)
          .eq('order_id', order.id);

        const itemsText = orderItems?.map(item => {
          const itemName = item.menu_items?.name || 'Item desconocido';
          return `${item.quantity}x ${itemName}`;
        }).join(', ') || 'Sin items';

        return supabase
          .from('archived_orders')
          .insert({
            original_order_id: order.id,
            hotel_id: order.hotel_id,
            room_number: order.room_number,
            items: itemsText,
            total: order.total,
            payment_method: order.payment_method,
            status: order.status,
            special_instructions: order.special_instructions,
            original_created_at: order.created_at,
            order_items_json: orderItems
          });
      });

      await Promise.all(archivePromises);
      console.log('✅ Pedidos archivados correctamente');

      // Delete original orders
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('hotel_id', hotelId)
        .in('status', ['completado', 'cancelado'])
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (deleteError) {
        throw deleteError;
      }

      console.log('🗑️ Pedidos originales eliminados');

      setClosureData(closureInfo);

      // Send to webhook
      try {
        await sendClosureToWebhook(closureInfo, hotelId);
        toast({
          title: "Cierre enviado",
          description: "El informe Z se ha enviado a la impresora automáticamente",
        });
      } catch (webhookError) {
        toast({
          title: "Advertencia",
          description: webhookError.message,
          variant: "destructive"
        });
      }

      // Update remaining orders
      const { data: remainingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (remainingOrders) {
        const formattedOrders: Order[] = await Promise.all(
          remainingOrders.map(async (order) => {
            const { data: orderItems } = await supabase
              .from('order_items')
              .select(`
                id,
                quantity,
                menu_items!menu_item_id (
                  id,
                  name,
                  price
                )
              `)
              .eq('order_id', order.id);

            const itemsText = orderItems?.map(item => {
              const itemName = item.menu_items?.name || 'Item desconocido';
              return `${item.quantity}x ${itemName}`;
            }).join(', ') || 'Sin items';

            return {
              id: order.id,
              roomNumber: order.room_number,
              items: itemsText,
              total: parseFloat(order.total.toString()),
              status: order.status as any,
              timestamp: new Date(order.created_at).toLocaleDateString('es-ES'),
              paymentMethod: order.payment_method || 'habitacion',
              specialInstructions: order.special_instructions,
              notes: order.notes
            };
          })
        );
        
        onOrdersChange(formattedOrders);
      }

      onDayStatsChange({
        totalFinalizados: 0,
        ventasDelDia: 0,
        platosDisponibles: 0,
        totalPlatos: 0
      });

      toast({
        title: "Cierre Z completado",
        description: `Se han archivado ${finishedOrders.length} pedidos y guardado en el historial`,
      });

    } catch (error) {
      console.error('❌ Error en cierre Z:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el cierre Z del día: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [hotelId, hotelName, onOrdersChange, onDayStatsChange, toast]);

  const handleReprint = useCallback(async () => {
    if (!closureData) return;
    
    try {
      await reprintClosure(closureData, hotelId);
      toast({
        title: "Reimpresión enviada",
        description: "El informe se ha enviado nuevamente a la impresora",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [closureData, hotelId, toast]);

  const handleDownload = useCallback(() => {
    if (!closureData) return;
    downloadExtract(closureData, hotelName);
  }, [closureData, hotelName]);

  const handlePrint = useCallback(() => {
    if (!closureData) return;
    printClosureReport(closureData, hotelName);
  }, [closureData, hotelName]);

  return {
    loading,
    closureData,
    performDayClosure,
    handleReprint,
    handleDownload,
    handlePrint
  };
};
