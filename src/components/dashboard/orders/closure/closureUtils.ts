
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ClosureData, ClosureInfo } from "./types";

export const sendClosureToWebhook = async (closureInfo: ClosureInfo, hotelId: string) => {
  try {
    console.log('🖨️ Enviando Cierre Z al webhook:', closureInfo);
    
    const { data, error } = await supabase.functions.invoke('print-report', {
      body: {
        type: 'closure_z',
        hotel_id: hotelId,
        totalPedidos: closureInfo.totalPedidos,
        pedidosCompletados: closureInfo.pedidosCompletados,
        pedidosCancelados: closureInfo.pedidosCancelados,
        pedidosEliminados: closureInfo.pedidosEliminados,
        totalDinero: closureInfo.totalDinero,
        metodosDetalle: closureInfo.metodosDetalle
      }
    });

    if (error) {
      console.error('❌ Error enviando al webhook:', error);
      throw new Error("El cierre se completó pero no se pudo enviar a la impresora");
    } else {
      console.log('✅ Cierre Z enviado al webhook exitosamente:', data);
      return { success: true, message: "El informe Z se ha enviado a la impresora automáticamente" };
    }
  } catch (webhookError) {
    console.error('❌ Error crítico en webhook:', webhookError);
    throw new Error("El cierre se completó pero hubo un error con la impresión automática");
  }
};

export const reprintClosure = async (closureData: ClosureData, hotelId: string) => {
  try {
    console.log('🖨️ Reimprimiendo Cierre Z vía webhook');
    
    const { data, error } = await supabase.functions.invoke('print-report', {
      body: {
        report_type: 'reprintClosure',
        hotel_id: hotelId,
        fecha: closureData.fecha,
        totalPedidos: closureData.totalPedidos,
        pedidosCompletados: closureData.pedidosCompletados,
        pedidosCancelados: closureData.pedidosCancelados,
        pedidosEliminados: closureData.pedidosEliminados,
        totalDinero: closureData.totalDinero,
        metodosDetalle: closureData.metodosDetalle
      }
    });

    if (error) {
      console.error('❌ Error reimprimiendo:', error);
      throw new Error("No se pudo reimprimir el informe");
    } else {
      console.log('✅ Reimpresión enviada exitosamente');
      return { success: true, message: "El informe se ha enviado nuevamente a la impresora" };
    }
  } catch (error) {
    console.error('❌ Error crítico reimprimiendo:', error);
    throw new Error("Error crítico al reimprimir");
  }
};

export const generateClosureData = (
  completedOrders: any[],
  cancelledOrders: any[],
  deletedOrdersCount: number,
  hotelName: string
): ClosureData => {
  const today = new Date();
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

  return {
    fecha: today.toLocaleDateString('es-ES'),
    hora: new Date().toLocaleString('es-ES'),
    hotel_name: hotelName,
    totalPedidos: completedOrders.length + cancelledOrders.length,
    pedidosCompletados: completedOrders.length,
    pedidosCancelados: cancelledOrders.length,
    pedidosEliminados: deletedOrdersCount,
    totalDinero,
    metodosDetalle,
    timestamp: new Date().toLocaleString('es-ES')
  };
};

export const saveDailyClosure = async (
  hotelId: string,
  finishedOrders: any[],
  completedOrders: any[],
  cancelledOrders: any[],
  deletedOrdersCount: number,
  totalDinero: number,
  metodosDetalle: Record<string, { cantidad: number; total: number }>
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const { error: closureError } = await supabase
      .from('daily_closures')
      .upsert({
        hotel_id: hotelId,
        closure_date: format(today, 'yyyy-MM-dd'),
        total_orders: finishedOrders.length,
        completed_orders: completedOrders.length,
        cancelled_orders: cancelledOrders.length,
        deleted_orders: deletedOrdersCount,
        total_revenue: totalDinero,
        payment_methods_detail: metodosDetalle,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'hotel_id,closure_date'
      });

    if (closureError) {
      console.error('Error guardando cierre en BD:', closureError);
    } else {
      console.log('✅ Cierre guardado en daily_closures exitosamente');
    }
  } catch (dbError) {
    console.error('Error de BD al guardar cierre:', dbError);
  }
};
