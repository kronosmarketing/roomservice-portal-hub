
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MapPin, Package, Hash, CheckCircle, Copy, Printer, X, Trash, FileText, DoorClosed } from "lucide-react";
import { Order, DayStats } from "./types";
import OrderReportsDialog from "./OrderReportsDialog";
import DayClosure from "./DayClosure";
import DeleteOrderDialog from "./DeleteOrderDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OrdersTabsProps {
  orders: Order[];
  onOrdersChange: (orders: Order[]) => void;
  onDayStatsChange: (stats: DayStats) => void;
  hotelId: string;
}

const OrdersTabs = ({ orders, onOrdersChange, onDayStatsChange, hotelId }: OrdersTabsProps) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [showReports, setShowReports] = useState(false);
  const [showClosure, setShowClosure] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparando":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completado":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast({
        title: "ID copiado",
        description: "El ID del pedido ha sido copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el ID",
        variant: "destructive"
      });
    }
  };

  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pedido #${order.id.substring(0, 8)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              .order-info { margin: 10px 0; }
              .items { background: #f5f5f5; padding: 10px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>Pedido #${order.id.substring(0, 8)}</h1>
            <div class="order-info"><strong>Habitación:</strong> ${order.roomNumber}</div>
            <div class="order-info"><strong>Fecha:</strong> ${order.timestamp}</div>
            <div class="order-info"><strong>Estado:</strong> ${order.status}</div>
            <div class="order-info"><strong>Método de pago:</strong> ${order.paymentMethod}</div>
            <div class="items">
              <strong>Items:</strong><br>
              ${order.items}
            </div>
            ${order.specialInstructions ? `<div class="order-info"><strong>Instrucciones:</strong> ${order.specialInstructions}</div>` : ''}
            <div class="order-info"><strong>Total:</strong> €${order.total.toFixed(2)}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      console.log('🔄 Actualizando pedido:', orderId, 'a estado:', newStatus);
      
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .eq('hotel_id', hotelId)
        .select();

      if (error) {
        console.error('❌ Error actualizando estado:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del pedido",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Pedido actualizado correctamente:', data);

      // Actualizar el estado local
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      );
      onOrdersChange(updatedOrders);

      // Si se marca como completado, actualizar estadísticas
      if (newStatus === 'completado') {
        const completedOrder = orders.find(o => o.id === orderId);
        if (completedOrder) {
          console.log('📊 Actualizando estadísticas para pedido completado');
          // Recalcular estadísticas del día
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const { data: todayOrders } = await supabase
            .from('orders')
            .select('total, status')
            .eq('hotel_id', hotelId)
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString());

          const completedOrders = todayOrders?.filter(o => o.status === 'completado') || [];
          const stats: DayStats = {
            totalFinalizados: completedOrders.length,
            ventasDelDia: completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0),
            platosDisponibles: 0,
            totalPlatos: 0
          };

          onDayStatsChange(stats);
        }
      }

      toast({
        title: "Estado actualizado",
        description: `Pedido marcado como ${newStatus}`,
      });

    } catch (error) {
      console.error('❌ Error inesperado actualizando pedido:', error);
      toast({
        title: "Error",
        description: "Error inesperado al actualizar el pedido",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const filterOrdersByStatus = (status: string[]) => {
    return orders.filter(order => status.includes(order.status));
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors group"
                      onClick={() => copyOrderId(order.id)}
                    >
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="font-mono text-sm font-medium">
                        #{order.id.substring(0, 8)}
                      </span>
                      <Copy className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hacer clic para copiar ID completo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Hab. {order.roomNumber}</span>
              </div>
              <Badge variant="outline" className={getStatusColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{order.timestamp}</span>
            </div>
            
            <div className="flex items-start gap-1">
              <Package className="h-4 w-4 text-gray-500 mt-0.5" />
              <span className="text-sm">{order.items}</span>
            </div>
            
            {order.specialInstructions && (
              <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border">
                <strong>Instrucciones:</strong> {order.specialInstructions}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                €{order.total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                {order.paymentMethod}
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => printOrder(order)}
                className="flex items-center gap-1"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              
              {(order.status === 'pendiente' || order.status === 'preparando') && (
                <>
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'completado')}
                    disabled={updating === order.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {updating === order.id ? 'Actualizando...' : 'Completar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateOrderStatus(order.id, 'cancelado')}
                    disabled={updating === order.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {updating === order.id ? 'Actualizando...' : 'Cancelar'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const preparingOrders = filterOrdersByStatus(['pendiente', 'preparando']);
  const completedOrders = filterOrdersByStatus(['completado']);
  const cancelledOrders = filterOrdersByStatus(['cancelado']);

  return (
    <div className="space-y-4">
      {/* Botones de Informe y Cierre */}
      <div className="flex gap-4 justify-end">
        <Button
          onClick={() => setShowDeleteDialog(true)}
          variant="outline"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash className="h-4 w-4 mr-2" />
          Eliminar Pedido
        </Button>
        <Button
          onClick={() => setShowReports(true)}
          variant="outline"
          className="bg-blue-50 hover:bg-blue-100"
        >
          <FileText className="h-4 w-4 mr-2" />
          Informe
        </Button>
        <Button
          onClick={() => setShowClosure(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <DoorClosed className="h-4 w-4 mr-2" />
          Cierre
        </Button>
      </div>

      <Tabs defaultValue="preparing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preparing">
            Preparando ({preparingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completados ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelados ({cancelledOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preparing">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos en Preparación</CardTitle>
            </CardHeader>
            <CardContent>
              {preparingOrders.length > 0 ? (
                preparingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay pedidos en preparación
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Completados</CardTitle>
            </CardHeader>
            <CardContent>
              {completedOrders.length > 0 ? (
                completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay pedidos completados
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelled">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Cancelados</CardTitle>
            </CardHeader>
            <CardContent>
              {cancelledOrders.length > 0 ? (
                cancelledOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay pedidos cancelados
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogos */}
      <OrderReportsDialog 
        isOpen={showReports}
        onClose={() => setShowReports(false)}
        hotelId={hotelId}
      />
      
      <DayClosure
        isOpen={showClosure}
        onClose={() => setShowClosure(false)}
        hotelId={hotelId}
        onOrdersChange={onOrdersChange}
        onDayStatsChange={onDayStatsChange}
      />

      <DeleteOrderDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        hotelId={hotelId}
        onOrderDeleted={(deletedOrderId) => {
          const updatedOrders = orders.filter(order => order.id !== deletedOrderId);
          onOrdersChange(updatedOrders);
        }}
      />
    </div>
  );
};

export default OrdersTabs;
