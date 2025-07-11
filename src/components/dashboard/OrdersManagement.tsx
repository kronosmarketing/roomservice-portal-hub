
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

  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Formatear items para que aparezcan uno por línea
      const formattedItems = order.items
        .split(', ')
        .map(item => `              ${item}`)
        .join('\n');

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
              .items {
                margin: 10px 0;
                white-space: pre-line;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 10px;
              }
            </style>
          </head>
          <body>
            <div class="center bold">
              HABITACIÓN ${order.roomNumber}
            </div>
            <div class="center">
              Pedido #${order.id.substring(0, 8)}
            </div>
            <div class="center">
              ${order.timestamp}
            </div>
            
            <div class="separator"></div>
            
            <div class="items">
${formattedItems}
            </div>
            
            <div class="separator"></div>
            
            <div class="bold">
              Total: €${order.total.toFixed(2)}
            </div>
            <div>
              Pago: ${order.paymentMethod === 'habitacion' ? 'Habitación' : 
                     order.paymentMethod === 'efectivo' ? 'Efectivo' : 
                     order.paymentMethod === 'tarjeta' ? 'Tarjeta' : order.paymentMethod}
            </div>
            
            ${order.specialInstructions ? `
            <div class="separator"></div>
            <div class="bold">Instrucciones:</div>
            <div>${order.specialInstructions}</div>
            ` : ''}
            
            <div class="footer">
              Gracias por su pedido
              <br><br>
              <strong>MarjorAI</strong>
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
            onPrintOrder={printOrder}
          />
        </>
      )}
    </div>
  );
};

export default OrdersManagement;
