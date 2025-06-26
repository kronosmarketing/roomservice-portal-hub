
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
  habitacion: number;
  efectivo: number;
  tarjeta: number;
  totalDinero: number;
}

const OrderReportsDialog = ({ isOpen, onClose, hotelId }: OrderReportsDialogProps) => {
  const [stats, setStats] = useState<ReportStats>({
    completados: 0,
    cancelados: 0,
    habitacion: 0,
    efectivo: 0,
    tarjeta: 0,
    totalDinero: 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadReportData = async () => {
    if (!hotelId) return;
    
    setLoading(true);
    try {
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

      if (todayOrders) {
        const completedOrders = todayOrders.filter(o => o.status === 'completado');
        const cancelledOrders = todayOrders.filter(o => o.status === 'cancelado');
        
        const habitacionOrders = completedOrders.filter(o => o.payment_method === 'habitacion');
        const efectivoOrders = completedOrders.filter(o => o.payment_method === 'efectivo');
        const tarjetaOrders = completedOrders.filter(o => o.payment_method === 'tarjeta');

        const totalMoney = completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);

        setStats({
          completados: completedOrders.length,
          cancelados: cancelledOrders.length,
          habitacion: habitacionOrders.length,
          efectivo: efectivoOrders.length,
          tarjeta: tarjetaOrders.length,
          totalDinero: totalMoney
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
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Informe Diario - ${today}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                line-height: 1.6;
              }
              h1 { 
                color: #333; 
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
              }
              .section {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
              }
              .section h2 {
                color: #666;
                margin-top: 0;
              }
              .stat-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 5px 0;
                border-bottom: 1px dotted #ccc;
              }
              .total {
                font-weight: bold;
                font-size: 1.2em;
                color: #2563eb;
              }
              .timestamp {
                text-align: center;
                color: #666;
                font-size: 0.9em;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <h1>Informe Diario del Servicio</h1>
            <p style="text-align: center; color: #666;">${today}</p>
            
            <div class="section">
              <h2>Estado de Pedidos</h2>
              <div class="stat-row">
                <span>Pedidos Completados:</span>
                <span class="total">${stats.completados}</span>
              </div>
              <div class="stat-row">
                <span>Pedidos Cancelados:</span>
                <span>${stats.cancelados}</span>
              </div>
            </div>

            <div class="section">
              <h2>Métodos de Pago (Solo Completados)</h2>
              <div class="stat-row">
                <span>Habitación:</span>
                <span>${stats.habitacion} pedidos</span>
              </div>
              <div class="stat-row">
                <span>Efectivo:</span>
                <span>${stats.efectivo} pedidos</span>
              </div>
              <div class="stat-row">
                <span>Tarjeta:</span>
                <span>${stats.tarjeta} pedidos</span>
              </div>
            </div>

            <div class="section">
              <h2>Resumen Financiero</h2>
              <div class="stat-row total">
                <span>Total Dinero del Día:</span>
                <span>€${stats.totalDinero.toFixed(2)}</span>
              </div>
            </div>

            <div class="timestamp">
              Informe generado el ${new Date().toLocaleString('es-ES')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Métodos de Pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Habitación:</span>
                    <span className="font-bold">{stats.habitacion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Efectivo:</span>
                    <span className="font-bold">{stats.efectivo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarjeta:</span>
                    <span className="font-bold">{stats.tarjeta}</span>
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
