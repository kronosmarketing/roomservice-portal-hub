import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Clock, CheckCircle, AlertCircle, Trash2, FileText, Printer, X, Eye, Hash, Copy, ChevronDown, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Order, DayStats } from "./types";
import { formatPrice, formatTime, getStatusColor, getStatusIcon } from "./orderUtils";
import { validateUserHotelAccess, sanitizeInput, validateOrderId } from "./securityUtils";
import OrderReportsDialog from "./OrderReportsDialog";
import DeleteOrderDialog from "./DeleteOrderDialog";
import DayClosure from "./DayClosure";
import SearchOrders from "../SearchOrders";
import MobileActionsMenu from "../mobile/MobileActionsMenu";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface OrdersTabsProps {
  orders: Order[];
  onOrdersChange: (orders: Order[]) => void;
  onDayStatsChange: (stats: DayStats) => void;
  hotelId: string;
}

const OrderStatusButton = ({ order, onStatusChange }: { order: Order; onStatusChange: (orderId: string, status: string) => void }) => {
  const nextStatus = {
    'pendiente': 'preparando',
    'preparando': 'completado',
    'completado': 'completado'
  };

  const statusLabels = {
    'pendiente': 'Preparando',
    'preparando': 'Completado',
    'completado': 'Completado'
  };

  const statusColors = {
    'pendiente': 'bg-yellow-500 hover:bg-yellow-600',
    'preparando': 'bg-blue-500 hover:bg-blue-600',
    'completado': 'bg-green-500'
  };

  if (order.status === 'completado') {
    return (
      <Button size="sm" className={statusColors[order.status]} disabled>
        <CheckCircle className="h-4 w-4 mr-1" />
        Completado
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className={`${statusColors[order.status]} text-white`}
      onClick={() => onStatusChange(order.id, nextStatus[order.status as keyof typeof nextStatus])}
    >
      {order.status === 'pendiente' ? (
        <Clock className="h-4 w-4 mr-1" />
      ) : (
        <AlertCircle className="h-4 w-4 mr-1" />
      )}
      {statusLabels[order.status as keyof typeof statusLabels]}
    </Button>
  );
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'pendiente':
      return 'bg-yellow-500 text-white border-yellow-500';
    case 'preparando':
      return 'bg-blue-500 text-white border-blue-500';
    case 'completado':
      return 'bg-green-500 text-white border-green-500';
    case 'cancelado':
      return 'bg-red-500 text-white border-red-500';
    default:
      return 'bg-gray-500 text-white border-gray-500';
  }
};

const OrderCard = ({ 
  order, 
  onStatusChange, 
  onCancelOrder, 
  onPrintOrder,
  showAllActions = false 
}: { 
  order: Order; 
  onStatusChange: (orderId: string, status: string) => void;
  onCancelOrder: (orderId: string) => void;
  onPrintOrder: (order: Order) => void;
  showAllActions?: boolean;
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast({
        title: "ID copiado",
        description: `ID del pedido copiado al portapapeles`,
      });
    } catch (error) {
      console.error('Error copiando ID:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el ID",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} mb-1`}>
              Habitación {sanitizeInput(order.roomNumber)}
            </CardTitle>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3 text-gray-500 flex-shrink-0" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-pointer group">
                        <span className="font-mono text-xs truncate">
                          #{order.id.substring(0, 8)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={() => copyOrderId(order.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Hacer clic para copiar ID completo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(order.timestamp)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-3">
            <Badge className={`${getStatusBadgeColor(order.status)} text-xs whitespace-nowrap`}>
              {getStatusIcon(order.status)}
              {isMobile ? order.status.charAt(0).toUpperCase() : order.status}
            </Badge>
            <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-green-600 whitespace-nowrap`}>
              {formatPrice(order.total)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          <div>
            <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
              {sanitizeInput(order.items)}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Pago: {sanitizeInput(order.paymentMethod || 'habitacion')}
          </div>
        </div>
        
        {order.specialInstructions && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm">
              <strong>Instrucciones especiales:</strong> {sanitizeInput(order.specialInstructions)}
            </p>
          </div>
        )}
        
        <div className={`flex ${isMobile ? 'flex-row gap-2 items-center justify-start' : 'justify-between items-center'}`}>
          <div className={`flex gap-2 ${isMobile ? 'flex-row items-center' : ''}`}>
            {(showAllActions || order.status !== 'completado') && (
              <OrderStatusButton order={order} onStatusChange={onStatusChange} />
            )}
            <Button
              size="sm"
              variant="outline" 
              onClick={() => onPrintOrder(order)}
              className="flex items-center gap-1 p-2 flex-shrink-0"
            >
              <Printer className="h-4 w-4" />
              {!isMobile && "Imprimir"}
            </Button>
            {order.status !== 'completado' && order.status !== 'cancelado' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onCancelOrder(order.id)}
                className="flex items-center gap-1 p-2 flex-shrink-0"
              >
                <X className="h-4 w-4" />
                {!isMobile && "Cancelar"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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

  const DesktopActionsMenu = () => (
    <div className="flex gap-3 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Acciones
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white z-50">
          <DropdownMenuItem onClick={() => setShowReports(true)} className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            Ver Informes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handlePrintDailyReport} className="cursor-pointer">
            <Printer className="h-4 w-4 mr-2" />
            Informe X (Parcial)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDayClosure(true)} className="cursor-pointer">
            <span className="h-4 w-4 mr-2 flex items-center justify-center font-bold text-purple-600">Z</span>
            Cierre Z (Final)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button 
        onClick={() => setShowSearch(true)}
        variant="outline"
        className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-300"
      >
        <Search className="h-4 w-4" />
        Buscar Pedidos
      </Button>
      
      <Button 
        onClick={() => setShowDeleteDialog(true)}
        variant="destructive"
        className="flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar Pedido
      </Button>
    </div>
  );

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
      <div className="flex gap-3 flex-wrap">
        {isMobile ? (
          <MobileActionsMenu 
            onShowReports={() => setShowReports(true)}
            onPrintDailyReport={handlePrintDailyReport}
            onShowDayClosure={() => setShowDayClosure(true)}
            onShowSearch={() => setShowSearch(true)}
            onShowDeleteDialog={() => setShowDeleteDialog(true)}
          />
        ) : (
          <DesktopActionsMenu />
        )}
      </div>

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

        <TabsContent value="all" className="mt-6">
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay pedidos</p>
          ) : (
            orders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={handleStatusChange}
                onCancelOrder={handleCancelOrder}
                onPrintOrder={handlePrintOrder}
                showAllActions={true}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pendingOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay pedidos pendientes</p>
          ) : (
            pendingOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={handleStatusChange}
                onCancelOrder={handleCancelOrder}
                onPrintOrder={handlePrintOrder}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="preparing" className="mt-6">
          {preparingOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay pedidos en preparación</p>
          ) : (
            preparingOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={handleStatusChange}
                onCancelOrder={handleCancelOrder}
                onPrintOrder={handlePrintOrder}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay pedidos completados hoy</p>
          ) : (
            completedOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={handleStatusChange}
                onCancelOrder={handleCancelOrder}
                onPrintOrder={handlePrintOrder}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {cancelledOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay pedidos cancelados hoy</p>
          ) : (
            cancelledOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={handleStatusChange}
                onCancelOrder={handleCancelOrder}
                onPrintOrder={handlePrintOrder}
              />
            ))
          )}
        </TabsContent>
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
