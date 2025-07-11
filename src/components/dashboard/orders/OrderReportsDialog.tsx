
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Printer, FileText } from "lucide-react";

interface OrderReportsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
}

interface ReportStats {
  completados: number;
  cancelados: number;
  eliminados: number;
  habitacion: number;
  efectivo: number;
  tarjeta: number;
  totalDinero: number;
  totalHabitacion: number;
  totalEfectivo: number;
  totalTarjeta: number;
}

const OrderReportsDialog = ({ isOpen, onClose, hotelId }: OrderReportsDialogProps) => {
  const [stats, setStats] = useState<ReportStats>({
    completados: 0,
    cancelados: 0,
    eliminados: 0,
    habitacion: 0,
    efectivo: 0,
    tarjeta: 0,
    totalDinero: 0,
    totalHabitacion: 0,
    totalEfectivo: 0,
    totalTarjeta: 0
  });
  const [loading, setLoading] = useState(false);
  const [hotelName, setHotelName] = useState('');
  const { toast } = useToast();

  const loadReportData = async () => {
    if (!hotelId) return;
    
    setLoading(true);
    try {
      // Obtener nombre del hotel
      const { data: hotelData } = await supabase
        .from('hotel_user_settings')
        .select('hotel_name')
        .eq('id', hotelId)
        .single();

      if (hotelData) {
        setHotelName(hotelData.hotel_name);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Obtener pedidos del día
      const { data: todayOrders, error } = await supabase
        .from('orders')
        .select('status, payment_method, total')
        .eq('hotel_id', hotelId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (error) {
        throw error;
      }

      // Obtener pedidos eliminados del día desde security_audit_log
      const { data: deletedOrdersLog, error: deletedError } = await supabase
        .from('security_audit_log')
        .select('created_at')
        .eq('hotel_id', hotelId)
        .eq('action', 'delete_order')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (deletedError) {
        console.error('Error obteniendo pedidos eliminados:', deletedError);
      }

      const deletedOrdersCount = deletedOrdersLog?.length || 0;

      if (todayOrders) {
        const completedOrders = todayOrders.filter(o => o.status === 'completado');
        const cancelledOrders = todayOrders.filter(o => o.status === 'cancelado');
        
        const habitacionOrders = completedOrders.filter(o => o.payment_method === 'habitacion');
        const efectivoOrders = completedOrders.filter(o => o.payment_method === 'efectivo');
        const tarjetaOrders = completedOrders.filter(o => o.payment_method === 'tarjeta');

        const totalMoney = completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
        const totalHabitacion = habitacionOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
        const totalEfectivo = efectivoOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
        const totalTarjeta = tarjetaOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);

        setStats({
          completados: completedOrders.length,
          cancelados: cancelledOrders.length,
          eliminados: deletedOrdersCount,
          habitacion: habitacionOrders.length,
          efectivo: efectivoOrders.length,
          tarjeta: tarjetaOrders.length,
          totalDinero: totalMoney,
          totalHabitacion,
          totalEfectivo,
          totalTarjeta
        });
      }
    } catch (error) {
      console.error('Error cargando datos del informe:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del informe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const today = new Date().toLocaleDateString('es-ES');
      const currentTime = new Date().toLocaleTimeString('es-ES');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket - Informe Diario</title>
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
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 10px;
              }
            </style>
          </head>
          <body>
            <div class="center bold">
              ${hotelName.toUpperCase()}
            </div>
            <div class="center bold">
              === INFORME DIARIO ===
            </div>
            <div class="center">
              ${today} - ${currentTime}
            </div>
            
            <div class="separator"></div>
            
            <div class="bold">RESUMEN DE PEDIDOS:</div>
            <div class="row">
              <span>Completados:</span>
              <span class="bold">${stats.completados}</span>
            </div>
            <div class="row">
              <span>Cancelados:</span>
              <span>${stats.cancelados}</span>
            </div>
            <div class="row">
              <span>Eliminados:</span>
              <span>${stats.eliminados}</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="bold">METODOS DE PAGO:</div>
            <div class="row">
              <span>Habitacion:</span>
              <span>${stats.habitacion} (€${stats.totalHabitacion.toFixed(2)})</span>
            </div>
            <div class="row">
              <span>Efectivo:</span>
              <span>${stats.efectivo} (€${stats.totalEfectivo.toFixed(2)})</span>
            </div>
            <div class="row">
              <span>Tarjeta:</span>
              <span>${stats.tarjeta} (€${stats.totalTarjeta.toFixed(2)})</span>
            </div>
            
            <div class="total-section">
              <div class="row bold">
                <span>TOTAL DEL DIA:</span>
                <span>€${stats.totalDinero.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="separator"></div>
            
            <div class="footer">
              Gracias por usar nuestro sistema
              <br>
              Generado: ${new Date().toLocaleString('es-ES')}
              <br><br>
              <strong>MarjorAI</strong>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Esperar a que se cargue el contenido antes de imprimir
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReportData();
    }
  }, [isOpen, hotelId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informe del Día
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Cargando datos del informe...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estado de Pedidos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Completados:</span>
                    <span className="font-bold text-green-600">{stats.completados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancelados:</span>
                    <span className="font-bold text-red-600">{stats.cancelados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Eliminados:</span>
                    <span className="font-bold text-gray-600">{stats.eliminados}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Métodos de Pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Habitación:</span>
                    <span className="font-bold">{stats.habitacion} (€{stats.totalHabitacion.toFixed(2)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Efectivo:</span>
                    <span className="font-bold">{stats.efectivo} (€{stats.totalEfectivo.toFixed(2)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarjeta:</span>
                    <span className="font-bold">{stats.tarjeta} (€{stats.totalTarjeta.toFixed(2)})</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-xl">
                  <span>Total del Día:</span>
                  <span className="font-bold text-green-600">€{stats.totalDinero.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={printReport} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Informe
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderReportsDialog;
