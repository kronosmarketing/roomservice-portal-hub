
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, ChefHat, Clock, DollarSign } from "lucide-react";

interface DashboardStatsProps {
  hotelId?: string;
}

const DashboardStats = ({ hotelId }: DashboardStatsProps) => {
  // Por ahora usamos datos de ejemplo - más adelante conectaremos con Supabase
  const stats = {
    totalOrders: 24,
    pendingOrders: 8,
    menuItems: 45,
    totalRevenue: 1250.50
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
          <ClipboardList className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-xs text-white/60">Hoy</p>
        </CardContent>
      </Card>

      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          <p className="text-xs text-white/60">En proceso</p>
        </CardContent>
      </Card>

      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items del Menú</CardTitle>
          <ChefHat className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.menuItems}</div>
          <p className="text-xs text-white/60">Disponibles</p>
        </CardContent>
      </Card>

      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
          <DollarSign className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-white/60">Hoy</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
