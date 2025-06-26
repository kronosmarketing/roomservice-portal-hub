
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DoorClosed, Download, AlertTriangle } from "lucide-react";
import { Order, DayStats } from "./types";

interface DayClosureProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  onOrdersChange: (orders: Order[]) => void;
  onDayStatsChange: (stats: DayStats) => void;
}

const DayClosure = ({ isOpen, onClose, hotelId, onOrdersChange, onDayStatsChange }: DayClosureProps) => {
  const [loading, setLoading] = useState(false);
  const [closureData, setClosureData] = useState<any>(null);
  const { toast } = useToast();

  const performDayClosure = async () => {
    if (!hotelId) return;
    
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log('🔄 Iniciando cierre del día para hotel:', hotelId);

      // Obtener todos los pedidos completados y cancelados del día
      const { data: finishedOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('hotel_id', hotelId)
        .in('status', ['completado', 'cancelado'])
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (ordersError) {
        throw ordersError;
      }

      if (!finishedOrders || finishedOrders.length === 0) {
        toast({
          title: "Sin pedidos",
          description: "No hay pedidos completados o cancelados para cerrar",
          variant: "destructive"
        });
        return;
      }

      console.log('📋 Pedidos a archivar:', finishedOrders.length);

      // Separar pedidos completados y cancelados para estadísticas
      const completedOrders = finishedOrders.filter(order => order.status === 'completado');
      const cancelledOrders = finishedOrders.filter(order => order.status === 'cancelado');

      // Calcular totales para el extracto
      const totalDinero = completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
      const metodosResumen = completedOrders.reduce((acc, order) => {
        const metodo = order.payment_method || 'habitacion';
        acc[metodo] = (acc[metodo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Archivar todos los pedidos (completados y cancelados)
      const archivePromises = finishedOrders.map(async (order) => {
        // Obtener items del pedido con consulta corregida
        const { data: orderItems } = await supabase
          .from('order_items')
          .select(`
            id,
            quantity,
            unit_price,
            total_price,
            special_instructions,
            menu_items!menu_item_id (
              id,
              name,
              price
            )
          `)
          .eq('order_id', order.id);

        const itemsText = orderItems?.map(item => {
          const itemName = item.menu_items?.name || 'Item desconocido';
          return `${item.quantity}x ${itemName}`;
        }).join(', ') || 'Sin items';

        // Insertar en archived_orders
        return supabase
          .from('archived_orders')
          .insert({
            original_order_id: order.id,
            hotel_id: order.hotel_id,
            room_number: order.room_number,
            items: itemsText,
            total: order.total,
            payment_method: order.payment_method,
            status: order.status,
            special_instructions: order.special_instructions,
            original_created_at: order.created_at,
            order_items_json: orderItems
          });
      });

      await Promise.all(archivePromises);
      console.log('✅ Pedidos archivados correctamente');

      // Eliminar pedidos originales (completados y cancelados)
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('hotel_id', hotelId)
        .in('status', ['completado', 'cancelado'])
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (deleteError) {
        throw deleteError;
      }

      console.log('🗑️ Pedidos originales eliminados');

      // Preparar datos del cierre
      const closureInfo = {
        fecha: today.toLocaleDateString('es-ES'),
        totalPedidos: finishedOrders.length,
        pedidosCompletados: completedOrders.length,
        pedidosCancelados: cancelledOrders.length,
        totalDinero,
        metodosResumen,
        timestamp: new Date().toLocaleString('es-ES')
      };

      setClosureData(closureInfo);

      // Actualizar estado local (quitar pedidos archivados)
      const { data: remainingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (remainingOrders) {
        // Convertir a formato Order con items
        const formattedOrders: Order[] = await Promise.all(
          remainingOrders.map(async (order) => {
            const { data: orderItems } = await supabase
              .from('order_items')
              .select(`
                id,
                quantity,
                menu_items!menu_item_id (
                  id,
                  name,
                  price
                )
              `)
              .eq('order_id', order.id);

            const itemsText = orderItems?.map(item => {
              const itemName = item.menu_items?.name || 'Item desconocido';
              return `${item.quantity}x ${itemName}`;
            }).join(', ') || 'Sin items';

            return {
              id: order.id,
              roomNumber: order.room_number,
              items: itemsText,
              total: parseFloat(order.total.toString()),
              status: order.status as any,
              timestamp: new Date(order.created_at).toLocaleDateString('es-ES'),
              paymentMethod: order.payment_method || 'habitacion',
              specialInstructions: order.special_instructions,
              notes: order.notes
            };
          })
        );
        
        onOrdersChange(formattedOrders);
      }

      // Resetear estadísticas (ya que se archivaron los completados)
      onDayStatsChange({
        totalFinalizados: 0,
        ventasDelDia: 0,
        platosDisponibles: 0,
        totalPlatos: 0
      });

      toast({
        title: "Cierre completado",
        description: `Se han archivado ${finishedOrders.length} pedidos (${completedOrders.length} completados, ${cancelledOrders.length} cancelados)`,
      });

    } catch (error) {
      console.error('❌ Error en cierre del día:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el cierre del día",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadExtract = () => {
    if (!closureData) return;

    const extractContent = `
EXTRACTO FINAL DEL DÍA
Fecha: ${closureData.fecha}
Generado: ${closureData.timestamp}

═══════════════════════════════════

RESUMEN DEL DÍA:
• Total de pedidos procesados: ${closureData.totalPedidos}
• Pedidos completados: ${closureData.pedidosCompletados}
• Pedidos cancelados: ${closureData.pedidosCancelados}
• Total recaudado: €${closureData.totalDinero.toFixed(2)}

MÉTODOS DE PAGO (solo pedidos completados):
${Object.entries(closureData.metodosResumen).map(([metodo, cantidad]) => 
  `• ${metodo.charAt(0).toUpperCase() + metodo.slice(1)}: ${cantidad} pedidos`
).join('\n')}

═══════════════════════════════════

Los pedidos completados y cancelados han sido archivados.
Fin del servicio del día.
    `;

    const blob = new Blob([extractContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracto-${closureData.fecha.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorClosed className="h-5 w-5" />
            Cierre del Día
          </DialogTitle>
        </DialogHeader>

        {closureData ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">¡Cierre Completado!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Pedidos archivados:</span>
                  <span className="font-bold">{closureData.totalPedidos}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completados:</span>
                  <span className="font-bold text-green-600">{closureData.pedidosCompletados}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cancelados:</span>
                  <span className="font-bold text-red-600">{closureData.pedidosCancelados}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total recaudado:</span>
                  <span className="font-bold text-green-600">€{closureData.totalDinero.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Fecha: {closureData.fecha}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={downloadExtract} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Descargar Extracto
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">¿Confirmar cierre del día?</p>
                <p className="text-yellow-700 mt-1">
                  Esta acción archivará todos los pedidos completados y cancelados, y generará el extracto final. 
                  No se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={performDayClosure}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Procesando...' : 'Confirmar Cierre'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DayClosure;
