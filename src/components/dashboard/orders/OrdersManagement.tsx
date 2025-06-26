
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import EnhancedOrdersLoader from "./EnhancedOrdersLoader";
import EnhancedOrdersRealtime from "./EnhancedOrdersRealtime";
import OrdersTabs from "./OrdersTabs";
import DayStatistics from "./DayStatistics";
import { Order, DayStats } from "./types";
import { logSecurityEvent } from "./securityUtils";

interface OrdersManagementProps {
  hotelId: string;
}

const OrdersManagement = ({ hotelId }: OrdersManagementProps) => {
  const mountedRef = useRef(false);
  const currentHotelIdRef = useRef<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayStats, setDayStats] = useState<DayStats>({
    totalFinalizados: 0,
    ventasDelDia: 0,
    platosDisponibles: 0,
    totalPlatos: 0,
    porcentajeVentasAnterior: undefined
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!hotelId) return;
    
    // Solo hacer log una vez por hotel
    if (currentHotelIdRef.current !== hotelId) {
      console.log('OrdersManagement inicializado de forma segura para hotel:', hotelId);
      currentHotelIdRef.current = hotelId;
      mountedRef.current = true;
      logSecurityEvent('orders_management_initialized', 'orders_management', hotelId);
    }
  }, [hotelId]);

  const handleNewOrder = async (newOrder: Order) => {
    if (!mountedRef.current) {
      console.log('⚠️ Componente no montado, ignorando nuevo pedido');
      return;
    }
    
    try {
      console.log('📥 Procesando nuevo pedido seguro:', newOrder.id.substring(0, 8));
      setOrders(prev => [newOrder, ...prev]);
      
      await logSecurityEvent('new_order_processed', 'orders', newOrder.id, {
        roomNumber: newOrder.roomNumber,
        total: newOrder.total
      });
      
      toast({
        title: "Nuevo pedido recibido",
        description: `Pedido #${newOrder.id.substring(0, 8)} de la habitación ${newOrder.roomNumber}`,
      });
    } catch (error) {
      console.error('Error procesando nuevo pedido:', error);
      await logSecurityEvent('new_order_processing_error', 'orders', newOrder.id, {
        error: String(error)
      });
    }
  };

  if (!hotelId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Acceso denegado: Hotel ID no disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EnhancedOrdersLoader 
        hotelId={hotelId}
        onOrdersLoaded={setOrders}
        onDayStatsLoaded={setDayStats}
        onLoadingChange={setLoading}
      />
      
      <EnhancedOrdersRealtime 
        hotelId={hotelId}
        onNewOrder={handleNewOrder}
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Cargando pedidos de forma segura...</p>
          </div>
        </div>
      ) : (
        <>
          <DayStatistics stats={dayStats} />

          <OrdersTabs 
            orders={orders}
            onOrdersChange={setOrders}
            onDayStatsChange={setDayStats}
            hotelId={hotelId}
          />
        </>
      )}
    </div>
  );
};

export default OrdersManagement;
