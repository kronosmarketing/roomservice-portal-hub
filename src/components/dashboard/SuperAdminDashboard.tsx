import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, Settings, Shield, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import HotelsManagement from "./admin/HotelsManagement";
import HotelPermissionsManager from "./admin/HotelPermissionsManager";
import SystemUsersManager from "./admin/SystemUsersManager";
import SystemSettings from "./admin/SystemSettings";

interface DashboardStats {
  totalHotels: number;
  activeHotels: number;
  totalUsers: number;
  totalOrders: number;
}

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalHotels: 0,
    activeHotels: 0,
    totalUsers: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Get hotels stats
      const { data: hotels, error: hotelsError } = await supabase
        .rpc('get_all_hotels');

      if (hotelsError) throw hotelsError;

      // Get total orders count
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (ordersError) throw ordersError;

      const totalHotels = hotels?.length || 0;
      const activeHotels = hotels?.filter(h => h.is_active).length || 0;

      setStats({
        totalHotels,
        activeHotels,
        totalUsers: totalHotels, // One user per hotel for now
        totalOrders: ordersCount || 0
      });

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas del panel.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700">
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Panel de Administración del Sistema
            </h1>
            <p className="text-gray-600">
              Gestión central de hoteles, usuarios y permisos
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hoteles</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalHotels}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeHotels} activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Usuarios del sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  En todo el sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge variant="secondary">Activo</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sistema operativo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="hotels" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hotels" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Hoteles</span>
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Permisos</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuarios</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configuración</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hotels">
              <HotelsManagement onStatsUpdate={loadDashboardStats} />
            </TabsContent>

            <TabsContent value="permissions">
              <HotelPermissionsManager />
            </TabsContent>

            <TabsContent value="users">
              <SystemUsersManager onStatsUpdate={loadDashboardStats} />
            </TabsContent>

            <TabsContent value="settings">
              <SystemSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;