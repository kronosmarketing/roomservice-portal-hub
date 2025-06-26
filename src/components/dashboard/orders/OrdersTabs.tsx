
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MapPin, Package, Hash, CheckCircle, XCircle } from "lucide-react";
import { Order, DayStats } from "./types";

interface OrdersTabsProps {
  orders: Order[];
  onOrdersChange: (orders: Order[]) => void;
  onDayStatsChange: (stats: DayStats) => void;
  hotelId: string;
}

const OrdersTabs = ({ orders, onOrdersChange, onDayStatsChange, hotelId }: OrdersTabsProps) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparando":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "listo":
        return "bg-green-100 text-green-800 border-green-200";
      case "entregado":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error actualizando estado:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del pedido",
          variant: "destructive"
        });
        return;
      }

      // Actualizar el estado local
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      );
      onOrdersChange(updatedOrders);

      toast({
        title: "Estado actualizado",
        description: `Pedido marcado como ${newStatus}`,
      });

    } catch (error) {
      console.error('Error actualizando pedido:', error);
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
              <div className="flex items-center gap-1">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="font-mono text-sm font-medium">
                  #{order.id.substring(0, 8)}
                </span>
              </div>
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
            
            <div className="flex gap-2">
              {order.status === 'pendiente' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'preparando')}
                  disabled={updating === order.id}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Preparar
                </Button>
              )}
              {order.status === 'preparando' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'listo')}
                  disabled={updating === order.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Listo
                </Button>
              )}
              {order.status === 'listo' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'entregado')}
                  disabled={updating === order.id}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Entregado
                </Button>
              )}
              {['pendiente', 'preparando'].includes(order.status) && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateOrderStatus(order.id, 'cancelado')}
                  disabled={updating === order.id}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const pendingOrders = filterOrdersByStatus(['pendiente']);
  const preparingOrders = filterOrdersByStatus(['preparando']);
  const readyOrders = filterOrdersByStatus(['listo']);
  const completedOrders = filterOrdersByStatus(['entregado']);

  return (
    <Tabs defaultValue="pending" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="pending">
          Pendientes ({pendingOrders.length})
        </TabsTrigger>
        <TabsTrigger value="preparing">
          Preparando ({preparingOrders.length})
        </TabsTrigger>
        <TabsTrigger value="ready">
          Listos ({readyOrders.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completados ({completedOrders.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay pedidos pendientes
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

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

      <TabsContent value="ready">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Listos</CardTitle>
          </CardHeader>
          <CardContent>
            {readyOrders.length > 0 ? (
              readyOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay pedidos listos
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
    </Tabs>
  );
};

export default OrdersTabs;
