import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Order, DayStats } from "./types";
import { formatPrice, getStatusColor, getStatusIcon } from "./orderUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Printer, FileText, DoorClosed, Trash2 } from "lucide-react";
import OrderReportsDialog from "./OrderReportsDialog";
import DayClosure from "./DayClosure";
import DeleteOrderDialog from "./DeleteOrderDialog";

interface OrdersTabsProps {
  orders: Order[];
  onOrdersChange: (orders: Order[]) => void;
  onDayStatsChange: (stats: DayStats) => void;
  hotelId: string;
  onPrintOrder?: (order: Order) => void;
}

const OrdersTabs = ({ orders, onOrdersChange, onDayStatsChange, hotelId, onPrintOrder }: OrdersTabsProps) => {
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [showClosureDialog, setShowClosureDialog] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  const pendingOrders = orders.filter(order => order.status === 'pendiente');
  const preparingOrders = orders.filter(order => order.status === 'preparando');
  const completedOrders = orders.filter(order => order.status === 'completado');
  const cancelledOrders = orders.filter(order => order.status === 'cancelado');

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      onOrdersChange(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));

      toast({
        title: "Estado actualizado",
        description: `Pedido marcado como ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive"
      });
    }
  };

  const printOrderViaWebhook = async (order: Order) => {
    try {
      console.log('🖨️ Enviando pedido al webhook de impresión:', order.id.substring(0, 8));
      
      const { data, error } = await supabase.functions.invoke('print-report', {
        body: {
          type: 'order_print',
          hotel_id: hotelId,
          order_id: order.id,
          data: {
            room_number: order.roomNumber,
            items: order.items,
            total: order.total.toString(),
            status: order.status,
            payment_method: order.paymentMethod,
            special_instructions: order.specialInstructions || '',
            timestamp: order.timestamp
          }
        }
      });

      if (error) {
        console.error('❌ Error enviando al webhook:', error);
        toast({
          title: "Error de impresión",
          description: "No se pudo enviar el pedido a la impresora",
          variant: "destructive"
        });
      } else {
        console.log('✅ Pedido enviado al webhook exitosamente:', data);
        toast({
          title: "Pedido enviado",
          description: "El pedido se ha enviado a la impresora automáticamente",
        });
      }
    } catch (webhookError) {
      console.error('❌ Error crítico en webhook:', webhookError);
      if (onPrintOrder) {
        console.log('🖨️ Fallback: usando impresión local');
        onPrintOrder(order);
      }
      toast({
        title: "Usando impresión local",
        description: "Error con la impresora automática, se abrió ventana de impresión",
      });
    }
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className={`border-l-4 ${getStatusColor(order.status)}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{getStatusIcon(order.status)}</span>
              Habitación {order.roomNumber}
            </CardTitle>
            <p className="text-sm text-gray-500">#{order.id.substring(0, 8)}</p>
          </div>
          <Badge variant="outline" className={getStatusColor(order.status)}>
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-1">Items:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {order.items.split(', ').map((item, index) => (
                <div key={index}>• {item}</div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Total: {formatPrice(order.total)}</span>
            <span className="text-sm text-gray-500">{order.timestamp}</span>
          </div>
          
          <div className="text-sm">
            <span className="font-medium">Pago: </span>
            {order.paymentMethod === 'habitacion' ? 'Habitación' : 
             order.paymentMethod === 'efectivo' ? 'Efectivo' : 
             order.paymentMethod === 'tarjeta' ? 'Tarjeta' : order.paymentMethod}
          </div>

          {order.specialInstructions && (
            <div className="text-sm">
              <span className="font-medium">Instrucciones: </span>
              <span className="text-gray-600">{order.specialInstructions}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {order.status === 'pendiente' && (
              <Button 
                size="sm" 
                onClick={() => updateOrderStatus(order.id, 'preparando')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Preparar
              </Button>
            )}
            
            {order.status === 'preparando' && (
              <Button 
                size="sm" 
                onClick={() => updateOrderStatus(order.id, 'completado')}
                className="bg-green-600 hover:bg-green-700"
              >
                Completar
              </Button>
            )}
            
            {(order.status === 'pendiente' || order.status === 'preparando') && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateOrderStatus(order.id, 'cancelado')}
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                Cancelar
              </Button>
            )}

            <Button 
              size="sm" 
              variant="outline"
              onClick={() => printOrderViaWebhook(order)}
              className="flex items-center gap-1"
            >
              <Printer className="h-3 w-3" />
              Imprimir
            </Button>

            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setDeleteOrderId(order.id)}
              className="border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gestión de Pedidos</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowReportsDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Informe del Día
          </Button>
          <Button 
            onClick={() => setShowClosureDialog(true)}
            variant="outline"
            className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
          >
            <DoorClosed className="h-4 w-4" />
            Cierre Z
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pendiente" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pendiente" className="relative">
            Pendientes
            {pendingOrders.length > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-white">
                {pendingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparando" className="relative">
            Preparando
            {preparingOrders.length > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white">
                {preparingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completado">
            Completados
            {completedOrders.length > 0 && (
              <Badge className="ml-2 bg-green-500 text-white">
                {completedOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelado">
            Cancelados
            {cancelledOrders.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">
                {cancelledOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendiente" className="space-y-4">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay pedidos pendientes
            </div>
          ) : (
            pendingOrders.map(renderOrderCard)
          )}
        </TabsContent>

        <TabsContent value="preparando" className="space-y-4">
          {preparingOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay pedidos en preparación
            </div>
          ) : (
            preparingOrders.map(renderOrderCard)
          )}
        </TabsContent>

        <TabsContent value="completado" className="space-y-4">
          {completedOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay pedidos completados
            </div>
          ) : (
            completedOrders.map(renderOrderCard)
          )}
        </TabsContent>

        <TabsContent value="cancelado" className="space-y-4">
          {cancelledOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay pedidos cancelados
            </div>
          ) : (
            cancelledOrders.map(renderOrderCard)
          )}
        </TabsContent>
      </Tabs>

      <OrderReportsDialog
        isOpen={showReportsDialog}
        onClose={() => setShowReportsDialog(false)}
        hotelId={hotelId}
      />

      <DayClosure
        isOpen={showClosureDialog}
        onClose={() => setShowClosureDialog(false)}
        hotelId={hotelId}
        onOrdersChange={onOrdersChange}
        onDayStatsChange={onDayStatsChange}
      />

      <DeleteOrderDialog
        isOpen={!!deleteOrderId}
        onClose={() => setDeleteOrderId(null)}
        orderId={deleteOrderId}
        hotelId={hotelId}
        onOrderDeleted={(deletedOrderId) => {
          onOrdersChange(orders.filter(order => order.id !== deletedOrderId));
          setDeleteOrderId(null);
        }}
      />
    </>
  );
};

export default OrdersTabs;
