
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DailyClosure {
  id: string;
  closure_date: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  deleted_orders: number;
  total_revenue: number;
  payment_methods_detail: Record<string, { cantidad: number; total: number }>;
  created_at: string;
}

interface ClosuresManagementProps {
  hotelId: string;
}

const ClosuresManagement = ({ hotelId }: ClosuresManagementProps) => {
  const [closures, setClosures] = useState<DailyClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date()
  });
  const { toast } = useToast();

  useEffect(() => {
    if (hotelId) {
      loadClosures();
    }
  }, [hotelId, dateRange]);

  const loadClosures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_closures')
        .select('*')
        .eq('hotel_id', hotelId)
        .gte('closure_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('closure_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('closure_date', { ascending: false });

      if (error) throw error;
      setClosures(data || []);
    } catch (error) {
      console.error('Error cargando cierres:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los cierres históricos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendComparison = () => {
    if (closures.length < 2) return null;
    
    const today = closures[0];
    const yesterday = closures[1];
    
    const revenueChange = ((today.total_revenue - yesterday.total_revenue) / yesterday.total_revenue) * 100;
    const ordersChange = ((today.total_orders - yesterday.total_orders) / yesterday.total_orders) * 100;

    return {
      revenueChange: revenueChange.toFixed(1),
      ordersChange: ordersChange.toFixed(1),
      revenueUp: revenueChange > 0,
      ordersUp: ordersChange > 0
    };
  };

  const prepareChartData = () => {
    return closures.slice().reverse().map(closure => ({
      date: format(new Date(closure.closure_date), 'dd/MM'),
      revenue: parseFloat(closure.total_revenue.toString()),
      orders: closure.total_orders,
      completed: closure.completed_orders,
      cancelled: closure.cancelled_orders,
      deleted: closure.deleted_orders
    }));
  };

  const preparePaymentMethodsData = () => {
    const aggregated: Record<string, number> = {};
    
    closures.forEach(closure => {
      Object.entries(closure.payment_methods_detail).forEach(([method, data]) => {
        if (!aggregated[method]) aggregated[method] = 0;
        aggregated[method] += data.total;
      });
    });

    return Object.entries(aggregated).map(([method, total]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: total,
      percentage: ((total / Object.values(aggregated).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
    }));
  };

  const exportData = () => {
    const csvContent = [
      ['Fecha', 'Total Pedidos', 'Completados', 'Cancelados', 'Eliminados', 'Ingresos'],
      ...closures.map(closure => [
        closure.closure_date,
        closure.total_orders,
        closure.completed_orders,
        closure.cancelled_orders,
        closure.deleted_orders,
        closure.total_revenue
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cierres-${format(dateRange.from, 'yyyy-MM-dd')}-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const chartData = prepareChartData();
  const paymentData = preparePaymentMethodsData();
  const trend = getTrendComparison();
  
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando cierres históricos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Historial de Cierres Z</h2>
          <p className="text-gray-600">Análisis de rendimiento y tendencias</p>
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'dd/MM/yyyy', { locale: es })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Desde:</label>
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                    locale={es}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hasta:</label>
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                    locale={es}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {trend && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{closures[0]?.total_revenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {trend.revenueUp ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {trend.revenueChange}% vs ayer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Hoy</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closures[0]?.total_orders}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {trend.ordersUp ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {trend.ordersChange}% vs ayer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{closures[0] ? (closures[0].total_revenue / closures[0].completed_orders || 0).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Por pedido completado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa Éxito</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {closures[0] ? ((closures[0].completed_orders / closures[0].total_orders) * 100).toFixed(1) : '0'}%
              </div>
              <p className="text-xs text-muted-foreground">Pedidos completados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`€${value}`, 'Ingresos']} />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="completed" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                <Area type="monotone" dataKey="cancelled" stackId="1" stroke="#ffc658" fill="#ffc658" />
                <Area type="monotone" dataKey="deleted" stackId="1" stroke="#ff7300" fill="#ff7300" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución Métodos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`€${value}`, 'Total']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Comparación Diaria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#8884d8" name="Total Pedidos" />
                <Bar dataKey="revenue" fill="#82ca9d" name="Ingresos (€)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Historical Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial Detallado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Total</th>
                  <th className="text-left p-2">Completados</th>
                  <th className="text-left p-2">Cancelados</th>
                  <th className="text-left p-2">Eliminados</th>
                  <th className="text-left p-2">Ingresos</th>
                  <th className="text-left p-2">Métodos Pago</th>
                </tr>
              </thead>
              <tbody>
                {closures.map((closure) => (
                  <tr key={closure.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{format(new Date(closure.closure_date), 'dd/MM/yyyy', { locale: es })}</td>
                    <td className="p-2 font-medium">{closure.total_orders}</td>
                    <td className="p-2 text-green-600">{closure.completed_orders}</td>
                    <td className="p-2 text-red-600">{closure.cancelled_orders}</td>
                    <td className="p-2 text-gray-600">{closure.deleted_orders}</td>
                    <td className="p-2 font-medium">€{closure.total_revenue.toFixed(2)}</td>
                    <td className="p-2">
                      <div className="text-xs">
                        {Object.entries(closure.payment_methods_detail).map(([method, data]) => (
                          <div key={method}>
                            {method}: {data.cantidad} (€{data.total.toFixed(2)})
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClosuresManagement;
