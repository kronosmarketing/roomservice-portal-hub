
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MapPin, Package, Hash, CheckCircle } from "lucide-react";
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
      case "completado":
        return "bg-green-100 text-green-800 border-green-200";
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

      // Si se marca como completado, actualizar estadísticas
      if (newStatus === 'completado') {
        const completedOrder = orders.find(o => o.id === orderId);
        if (completedOrder) {
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
              {(order.status === 'pendiente' || order.status === 'preparando') && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'completado')}
                  disabled={updating === order.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const preparingOrders = filterOrdersByStatus(['pendiente', 'preparando']);
  const completedOrders = filterOrdersByStatus(['completado']);

  return (
    <Tabs defaultValue="preparing" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="preparing">
          Preparando ({preparingOrders.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completados ({completedOrders.length})
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
    </Tabs>
  );
};

export default OrdersTabs;
