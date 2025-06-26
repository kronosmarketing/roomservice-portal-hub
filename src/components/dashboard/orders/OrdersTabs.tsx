
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle, Trash2, FileText, Printer, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Order, DayStats } from "./types";
import { formatPrice, formatTime, getStatusColor, getStatusIcon } from "./orderUtils";
import { validateUserHotelAccess, sanitizeInput, validateOrderId } from "./securityUtils";
import OrderReportsDialog from "./OrderReportsDialog";
import DeleteOrderDialog from "./DeleteOrderDialog";
import { useToast } from "@/hooks/use-toast";

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
    'pendiente': 'Marcar como Preparando',
    'preparando': 'Marcar como Completado',
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
}) => (
  <Card className="mb-4">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg">Habitación {sanitizeInput(order.roomNumber)}</CardTitle>
          <p className="text-sm text-gray-500">
            Pedido #{order.id.substring(0, 8)} • {formatTime(order.timestamp)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(order.status)}>
            {getStatusIcon(order.status)}
            {order.status}
          </Badge>
          <span className="text-lg font-bold">{formatPrice(order.total)}</span>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-medium">{sanitizeInput(order.items)}</span>
          </div>
        </div>
      </div>
      
      {order.specialInstructions && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm">
            <strong>Instrucciones especiales:</strong> {sanitizeInput(order.specialInstructions)}
          </p>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Método de pago: {sanitizeInput(order.paymentMethod || 'habitacion')}
        </div>
        <div className="flex gap-2">
          {(showAllActions || order.status !== 'completado') && (
            <OrderStatusButton order={order} onStatusChange={onStatusChange} />
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPrintOrder(order)}
            className="flex items-center gap-1"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          {order.status !== 'completado' && order.status !== 'cancelado' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onCancelOrder(order.id)}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const OrdersTabs = ({ orders, onOrdersChange, onDayStatsChange, hotelId }: OrdersTabsProps) => {
  const [showReports, setShowReports] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const pendingOrders = orders.filter(order => order.status === 'pendiente');
  const preparingOrders = orders.filter(order => order.status === 'preparando');
  const completedOrders = orders.filter(order => order.status === 'completado');

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

  const handlePrintOrder = (order: Order) => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const currentTime = new Date().toLocaleString('es-ES');
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Ticket - Pedido #${order.id.substring(0, 8)}</title>
              <style>
                @media print {
                  @page { 
                    size: 80mm auto; 
                    margin: 0; 
                  }
                }
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px;
                  margin: 0;
                  padding: 10px;
                  width: 80mm;
                  line-height: 1.2;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .separator { 
                  border-top: 1px dashed #000; 
                  margin: 10px 0; 
                }
                .row {
                  display: flex;
                  justify-content: space-between;
                  margin: 2px 0;
                }
                .total-section {
                  margin-top: 15px;
                  padding-top: 10px;
                  border-top: 2px solid #000;
                }
              </style>
            </head>
            <body>
              <div class="center bold">
                === PEDIDO #${order.id.substring(0, 8)} ===
              </div>
              <div class="center">
                Habitación: ${sanitizeInput(order.roomNumber)}
              </div>
              <div class="center">
                ${order.timestamp}
              </div>
              
              <div class="separator"></div>
              
              <div class="bold">PRODUCTOS:</div>
              <div>${sanitizeInput(order.items)}</div>
              
              ${order.specialInstructions ? `
              <div class="separator"></div>
              <div class="bold">INSTRUCCIONES:</div>
              <div>${sanitizeInput(order.specialInstructions)}</div>
              ` : ''}
              
              <div class="separator"></div>
              
              <div class="row">
                <span>Estado:</span>
                <span class="bold">${order.status.toUpperCase()}</span>
              </div>
              <div class="row">
                <span>Pago:</span>
                <span>${sanitizeInput(order.paymentMethod || 'habitacion')}</span>
              </div>
              
              <div class="total-section">
                <div class="row bold">
                  <span>TOTAL:</span>
                  <span>${formatPrice(order.total)}</span>
                </div>
              </div>
              
              <div class="separator"></div>
              
              <div class="center">
                Impreso: ${currentTime}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (error) {
      console.error('Error imprimiendo pedido:', error);
      toast({
        title: "Error",
        description: "No se pudo imprimir el pedido",
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

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap">
        <Button 
          onClick={() => setShowReports(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Ver Informes
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Todos ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendientes ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="preparing" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Preparando ({preparingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completados ({completedOrders.length})
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
    </div>
  );
};

export default OrdersTabs;
