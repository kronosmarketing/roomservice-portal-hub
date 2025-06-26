
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Euro, TrendingUp, Clock } from "lucide-react";
import { DayStats } from "./types";

interface DayStatisticsProps {
  stats: DayStats;
}

const DayStatistics = ({ stats }: DayStatisticsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pedidos Finalizados</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalFinalizados}</div>
          <p className="text-xs text-muted-foreground">
            pedidos entregados hoy
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
          <Euro className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{stats.ventasDelDia.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            ingresos totales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Platos Disponibles</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.platosDisponibles}</div>
          <p className="text-xs text-muted-foreground">
            de {stats.totalPlatos} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.porcentajeVentasAnterior ? `${stats.porcentajeVentasAnterior}%` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            vs día anterior
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DayStatistics;
