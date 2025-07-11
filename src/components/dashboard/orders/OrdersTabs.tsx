
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, AlertCircle, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Order, DayStats } from "./types";
import { validateUserHotelAccess, validateOrderId } from "./securityUtils";
import OrderReportsDialog from "./OrderReportsDialog";
import DeleteOrderDialog from "./DeleteOrderDialog";
import DayClosure from "./DayClosure";
import SearchOrders from "../SearchOrders";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import OrdersActionsMenu from "./OrdersActionsMenu";
import OrdersTabsContent from "./OrdersTabsContent";

interface OrdersTabsProps {
  orders: Order[];
  onOrdersChange: (orders: Order[]) => void;
  onDayStatsChange: (stats: DayStats) => void;
  hotelId: string;
}

const OrdersTabs = ({ orders, onOrdersChange, onDayStatsChange, hotelId }: OrdersTabsProps) => {
  const [showReports, setShowReports] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDayClosure, setShowDayClosure] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [hotelName, setHotelName] = useState('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const pendingOrders = orders.filter(order => order.status === 'pendiente');
  const preparingOrders = orders.filter(order => order.status === 'preparando');
  const completedOrders = orders.filter(order => order.status === 'completado');
  const cancelledOrders = orders.filter(order => order.status === 'cancelado');

  useEffect(() => {
    const getHotelName = async () => {
      if (!hotelId) return;
      
      try {
        const { data: hotelData } = await supabase
          .from('hotel_user_settings')
          .select('hotel_name')
          .eq('id', hotelId)
          .single();

        if (hotelData) {
          setHotelName(hotelData.hotel_name);
        }
      } catch (error) {
        console.error('Error obteniendo nombre del hotel:', error);
      }
    };

    getHotelName();
  }, [hotelId]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // Validar entrada
      if (!validateOrderId(orderId)) {
        toast({
          title: "Error",
          description: "ID de pedido inválido",
          variant: "destructive"
        });
        return;
      }

      // Validar acceso al hotel
      const hasAccess = await validateUserHotelAccess(hotelId);
      if (!hasAccess) {
        toast({
          title: "Error de autorización",
          description: "No tienes permiso para modificar este pedido",
          variant: "destructive"
        });
        return;
      }

      // Validar estados permitidos
      const allowedStatuses = ['pendiente', 'preparando', 'completado', 'cancelado'];
      if (!allowedStatuses.includes(newStatus)) {
        toast({
          title: "Error",
          description: "Estado de pedido inválido",
          variant: "destructive"
        });
        return;
      }

      console.log('🔄 Actualizando estado del pedido:', { orderId: orderId.substring(0, 8), newStatus });

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error actualizando status:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del pedido",
          variant: "destructive"
        });
        return;
      }

      // Actualizar el estado local
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as Order['status'] }
          : order
      );
      
      onOrdersChange(updatedOrders);

      // Recalcular estadísticas del día
      const completedCount = updatedOrders.filter(o => o.status === 'completado').length;
      const totalSales = updatedOrders
        .filter(o => o.status === 'completado')
        .reduce((sum, order) => sum + order.total, 0);

      onDayStatsChange({
        totalFinalizados: completedCount,
        ventasDelDia: totalSales,
        platosDisponibles: 0,
        totalPlatos: 0
      });

      toast({
        title: "Estado actualizado",
        description: `Pedido #${orderId.substring(0, 8)} marcado como ${newStatus}`,
      });

    } catch (error) {
      console.error('Error actualizando status:', error);
      toast({
        title: "Error",
        description: "Error inesperado al actualizar el pedido",
        variant: "destructive"
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      // Validar entrada
      if (!validateOrderId(orderId)) {
        toast({
          title: "Error",
          description: "ID de pedido inválido",
          variant: "destructive"
        });
        return;
      }

      // Validar acceso al hotel
      const hasAccess = await validateUserHotelAccess(hotelId);
      if (!hasAccess) {
        toast({
          title: "Error de autorización",
          description: "No tienes permiso para cancelar este pedido",
          variant: "destructive"
        });
        return;
      }

      console.log('❌ Cancelando pedido:', orderId.substring(0, 8));

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelado', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error cancelando pedido:', error);
        toast({
          title: "Error",
          description: "No se pudo cancelar el pedido",
          variant: "destructive"
        });
        return;
      }

      // Actualizar el estado local
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelado' as Order['status'] }
          : order
      );
      
      onOrdersChange(updatedOrders);

      // Recalcular estadísticas del día
      const completedCount = updatedOrders.filter(o => o.status === 'completado').length;
      const totalSales = updatedOrders
        .filter(o => o.status === 'completado')
        .reduce((sum, order) => sum + order.total, 0);

      onDayStatsChange({
        totalFinalizados: completedCount,
        ventasDelDia: totalSales,
        platosDisponibles: 0,
        totalPlatos: 0
      });

      toast({
        title: "Pedido cancelado",
        description: `Pedido #${orderId.substring(0, 8)} ha sido cancelado`,
      });

    } catch (error) {
      console.error('Error cancelando pedido:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cancelar el pedido",
        variant: "destructive"
      });
    }
  };

  const handlePrintOrder = async (order: Order) => {
    try {
      console.log('🖨️ Enviando pedido al webhook:', order.id.substring(0, 8));

      // Formatear los items correctamente
      let formattedItems = order.items;
      
      // Si los items vienen como JSON, parsearlos y formatearlos
      try {
        if (typeof order.items === 'string' && order.items.startsWith('[')) {
          const itemsArray = JSON.parse(order.items);
          formattedItems = itemsArray
            .map((item: any) => {
              if (item.quantity && item.name) {
                return `${item.quantity}x ${item.name}`;
              } else if (item.quantity && item.menu_item?.name) {
                return `${item.quantity}x ${item.menu_item.name}`;
              }
              return item.toString();
            })
            .join('\n');
        }
      } catch (parseError) {
        console.log('Items no requieren parsing:', parseError);
        // Mantener el formato original si no se puede parsear
      }

      console.log('📝 Items formateados:', formattedItems);

      // Enviar al webhook únicamente
      const { data: response, error: webhookError } = await supabase.functions.invoke('print-report', {
        body: {
          type: 'order_print',
          hotel_id: hotelId,
          order_id: order.id,
          data: {
            room_number: order.roomNumber,
            items: formattedItems,
            total: order.total,
            status: order.status,
            payment_method: order.paymentMethod,
            special_instructions: order.specialInstructions,
            timestamp: order.timestamp
          }
        }
      });

      if (webhookError) {
        console.error('❌ Error enviando al webhook:', webhookError);
        toast({
          title: "Error",
          description: `No se pudo enviar el pedido al webhook: ${webhookError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Pedido enviado al webhook correctamente:', response);
      
      toast({
        title: "Pedido enviado",
        description: `Pedido #${order.id.substring(0, 8)} enviado al sistema de impresión correctamente`,
      });

    } catch (error) {
      console.error('❌ Error procesando pedido:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el pedido",
        variant: "destructive"
      });
    }
  };

  const handlePrintDailyReport = async () => {
    try {
      console.log('🔄 Iniciando generación de Informe X para hotel:', hotelId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Obtener pedidos del día
      const { data: todayOrders, error } = await supabase
        .from('orders')
        .select('status, payment_method, total')
        .eq('hotel_id', hotelId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (error) {
        throw error;
      }

      // Obtener pedidos eliminados del día desde security_audit_log
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

      if (todayOrders) {
        const completedOrders = todayOrders.filter(o => o.status === 'completado');
        const cancelledOrders = todayOrders.filter(o => o.status === 'cancelado');
        
        // Calcular totales por método de pago
        const metodosDetalle = completedOrders.reduce((acc, order) => {
          const method = order.payment_method || 'habitacion';
          if (!acc[method]) {
            acc[method] = { cantidad: 0, total: 0 };
          }
          acc[method].cantidad += 1;
          acc[method].total += parseFloat(order.total.toString());
          return acc;
        }, {} as Record<string, { cantidad: number; total: number }>);

        const totalMoney = completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);

        const reportPayload = {
          type: 'daily_report_x',
          hotel_id: hotelId,
          total_pedidos: todayOrders.length,
          pedidos_completados: completedOrders.length,
          pedidos_cancelados: cancelledOrders.length,
          pedidos_eliminados: deletedOrdersCount,
          total_dinero: totalMoney,
          metodosDetalle: metodosDetalle
        };

        console.log('📊 Payload del Informe X preparado:', JSON.stringify(reportPayload, null, 2));

        const { data: response, error: webhookError } = await supabase.functions.invoke('print-report', {
          body: reportPayload
        });

        if (webhookError) {
          console.error('❌ Error enviando Informe X al webhook:', webhookError);
          throw new Error(`Error del webhook: ${webhookError.message}`);
        } else {
          console.log('✅ Informe X enviado correctamente:', response);
        }
      }

      toast({
        title: "Informe X enviado",
        description: "Informe parcial del día enviado al sistema de impresión correctamente",
      });

    } catch (error) {
      console.error('❌ Error generando Informe X:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el Informe X: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleOrderDeleted = async (deletedOrderId: string) => {
    try {
      console.log('🔄 Actualizando lista tras eliminar:', deletedOrderId);
      
      // Validar acceso al hotel antes de proceder
      const hasAccess = await validateUserHotelAccess(hotelId);
      if (!hasAccess) {
        toast({
          title: "Error de autorización",
          description: "No tienes permiso para eliminar pedidos",
          variant: "destructive"
        });
        return;
      }
      
      // Filtrar el pedido eliminado de la lista
      const updatedOrders = orders.filter(order => {
        const orderIdShort = order.id.substring(0, 8);
        const deletedIdShort = deletedOrderId.substring(0, 8);
        return order.id !== deletedOrderId && orderIdShort !== deletedIdShort;
      });
      
      console.log('📊 Pedidos antes:', orders.length, 'después:', updatedOrders.length);
      
      onOrdersChange(updatedOrders);

      // Recalcular estadísticas
      const completedCount = updatedOrders.filter(o => o.status === 'completado').length;
      const totalSales = updatedOrders
        .filter(o => o.status === 'completado')
        .reduce((sum, order) => sum + order.total, 0);

      onDayStatsChange({
        totalFinalizados: completedCount,
        ventasDelDia: totalSales,
        platosDisponibles: 0,
        totalPlatos: 0
      });

      toast({
        title: "Pedido eliminado",
        description: `Pedido #${deletedOrderId.substring(0, 8)} eliminado correctamente`,
      });
    } catch (error) {
      console.error('Error procesando eliminación:', error);
      toast({
        title: "Error",
        description: "Error inesperado al procesar la eliminación",
        variant: "destructive"
      });
    }
  };

  if (showSearch) {
    return (
      <SearchOrders 
        hotelId={hotelId}
        onBack={() => setShowSearch(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <OrdersActionsMenu
        onShowReports={() => setShowReports(true)}
        onPrintDailyReport={handlePrintDailyReport}
        onShowDayClosure={() => setShowDayClosure(true)}
        onShowSearch={() => setShowSearch(true)}
        onShowDeleteDialog={() => setShowDeleteDialog(true)}
      />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className={`${isMobile ? 'grid w-full grid-cols-5 overflow-x-auto scrollbar-hide' : 'grid w-full grid-cols-5'}`}>
          <TabsTrigger 
            value="all" 
            className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 transition-all data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800 data-[state=active]:border-gray-300"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Todos</span> ({orders.length})
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 transition-all data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800 data-[state=active]:border-yellow-300"
          >
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Pend.</span> ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger 
            value="preparing" 
            className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 transition-all data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:border-blue-300"
          >
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Prep.</span> ({preparingOrders.length})
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 transition-all data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:border-green-300"
          >
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Comp.</span> ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger 
            value="cancelled" 
            className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 transition-all data-[state=active]:bg-red-100 data-[state=active]:text-red-800 data-[state=active]:border-red-300"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Canc.</span> ({cancelledOrders.length})
          </TabsTrigger>
        </TabsList>

        <OrdersTabsContent
          orders={orders}
          onStatusChange={handleStatusChange}
          onCancelOrder={handleCancelOrder}
          onPrintOrder={handlePrintOrder}
          showAllActions={true}
          tabValue="all"
          emptyMessage="No hay pedidos"
        />

        <OrdersTabsContent
          orders={pendingOrders}
          onStatusChange={handleStatusChange}
          onCancelOrder={handleCancelOrder}
          onPrintOrder={handlePrintOrder}
          tabValue="pending"
          emptyMessage="No hay pedidos pendientes"
        />

        <OrdersTabsContent
          orders={preparingOrders}
          onStatusChange={handleStatusChange}
          onCancelOrder={handleCancelOrder}
          onPrintOrder={handlePrintOrder}
          tabValue="preparing"
          emptyMessage="No hay pedidos en preparación"
        />

        <OrdersTabsContent
          orders={completedOrders}
          onStatusChange={handleStatusChange}
          onCancelOrder={handleCancelOrder}
          onPrintOrder={handlePrintOrder}
          tabValue="completed"
          emptyMessage="No hay pedidos completados hoy"
        />

        <OrdersTabsContent
          orders={cancelledOrders}
          onStatusChange={handleStatusChange}
          onCancelOrder={handleCancelOrder}
          onPrintOrder={handlePrintOrder}
          tabValue="cancelled"
          emptyMessage="No hay pedidos cancelados hoy"
        />
      </Tabs>

      <OrderReportsDialog 
        isOpen={showReports}
        onClose={() => setShowReports(false)}
        hotelId={hotelId}
      />

      <DeleteOrderDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        hotelId={hotelId}
        onOrderDeleted={handleOrderDeleted}
      />

      <DayClosure
        isOpen={showDayClosure}
        onClose={() => setShowDayClosure(false)}
        hotelId={hotelId}
        onOrdersChange={onOrdersChange}
        onDayStatsChange={onDayStatsChange}
      />
    </div>
  );
};

export default OrdersTabs;
