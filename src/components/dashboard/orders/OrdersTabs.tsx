
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { Order, DayStats } from "./types";
import { formatPrice, formatTime, getStatusColor, getStatusIcon } from "./orderUtils";
import OrderReportsDialog from "./OrderReportsDialog";
import DeleteOrderDialog from "./DeleteOrderDialog";

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

const OrderCard = ({ order, onStatusChange }: { order: Order; onStatusChange: (orderId: string, status: string) => void }) => (
  <Card className="mb-4">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg">Habitación {order.roomNumber}</CardTitle>
          <p className="text-sm text-gray-500">
            Pedido #{order.id.substring(0, 8)} • {formatTime(order.createdAt)}
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
        {order.items && order.items.map((item: any, index: number) => (
          <div key={index} className="flex justify-between items-center">
            <div>
              <span className="font-medium">{item.quantity}x {item.name}</span>
              {item.special_instructions && (
                <p className="text-sm text-gray-600 italic">
                  Nota: {item.special_instructions}
                </p>
              )}
            </div>
            <span className="text-sm">{formatPrice(item.total_price)}</span>
          </div>
        ))}
      </div>
      
      {order.specialInstructions && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm"><strong>Instrucciones especiales:</strong> {order.specialInstructions}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Método de pago: {order.paymentMethod || 'habitacion'}
        </div>
        <OrderStatusButton order={order} onStatusChange={onStatusChange} />
      </div>
    </CardContent>
  </Card>
);

const OrdersTabs = ({ orders, onOrdersChange, onDayStatsChange, hotelId }: OrdersTabsProps) => {
  const [showReports, setShowReports] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const pendingOrders = orders.filter(order => order.status === 'pendiente');
  const preparingOrders = orders.filter(order => order.status === 'preparando');
  const completedOrders = orders.filter(order => order.status === 'completado');

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('hotel_id', hotelId);

      if (error) throw error;

      // Actualizar el estado local
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
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

    } catch (error) {
      console.error('Error actualizando status:', error);
    }
  };

  const handleOrderDeleted = (deletedOrderId: string) => {
    console.log('🔄 Actualizando lista tras eliminar:', deletedOrderId);
    
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
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap">
        <Button 
          onClick={() => setShowReports(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          📊 Ver Reportes
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

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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

        <TabsContent value="pending" className="mt-6">
          {pendingOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay pedidos pendientes</p>
          ) : (
            pendingOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={handleStatusChange}
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
