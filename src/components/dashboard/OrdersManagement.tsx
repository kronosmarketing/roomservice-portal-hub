
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import OrdersLoader from "./orders/OrdersLoader";
import OrdersRealtime from "./orders/OrdersRealtime";
import OrdersTabs from "./orders/OrdersTabs";
import DayStatistics from "./orders/DayStatistics";
import { Order, DayStats } from "./orders/types";

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
      console.log('OrdersManagement inicializado para hotel:', hotelId);
      currentHotelIdRef.current = hotelId;
      mountedRef.current = true;
    }
  }, [hotelId]);

  const handleNewOrder = (newOrder: Order) => {
    if (!mountedRef.current) {
      console.log('⚠️ Componente no montado, ignorando nuevo pedido');
      return;
    }
    
    console.log('📥 Procesando nuevo pedido:', newOrder.id.substring(0, 8));
    setOrders(prev => [newOrder, ...prev]);
    toast({
      title: "Nuevo pedido recibido",
      description: `Pedido #${newOrder.id.substring(0, 8)} de la habitación ${newOrder.roomNumber}`,
    });
  };

  if (!hotelId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Hotel ID no disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrdersLoader 
        hotelId={hotelId}
        onOrdersLoaded={setOrders}
        onDayStatsLoaded={setDayStats}
        onLoadingChange={setLoading}
      />
      
      <OrdersRealtime 
        hotelId={hotelId}
        onNewOrder={handleNewOrder}
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Cargando pedidos...</p>
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
