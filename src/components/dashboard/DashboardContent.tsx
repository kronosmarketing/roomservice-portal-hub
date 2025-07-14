
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersManagement from "./OrdersManagement";
import MenuManagement from "./MenuManagement";
import EscandallosManagement from "./EscandallosManagement";
import ProveedoresManagement from "./ProveedoresManagement";
import ClosuresManagement from "./ClosuresManagement";
import { Package, UtensilsCrossed, Calculator, Building2, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardUser {
  userRole: string;
  hotelId: string;
  hotelName: string;
  agentName: string;
  email: string;
}

interface DashboardContentProps {
  user: DashboardUser;
}

const DashboardContent = ({ user }: DashboardContentProps) => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    orders: true,
    menu: true,
    escandallos: true,
    proveedores: true,
    cierres: true
  });

  useEffect(() => {
    loadPermissions();
  }, [user.hotelId]);

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_hotel_permissions', { target_hotel_id: user.hotelId });

      if (error) throw error;

      if (data && data.length > 0) {
        const permissionMap = data.reduce((acc: Record<string, boolean>, perm: any) => {
          acc[perm.feature_name] = perm.enabled;
          return acc;
        }, {});
        setPermissions(permissionMap);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Keep default permissions if error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700">
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Panel de Control - {user.hotelName}
            </h1>
            <p className="text-gray-600">
              Bienvenido, {user.agentName} • {user.email}
            </p>
          </div>

          <Tabs defaultValue={permissions.orders ? "orders" : Object.keys(permissions).find(key => permissions[key]) || "orders"} className="space-y-6">
            <TabsList className={`grid w-full grid-cols-${Object.values(permissions).filter(Boolean).length}`}>
              {permissions.orders && (
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Pedidos</span>
                </TabsTrigger>
              )}
              {permissions.menu && (
                <TabsTrigger value="menu" className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span className="hidden sm:inline">Menú</span>
                </TabsTrigger>
              )}
              {permissions.escandallos && (
                <TabsTrigger value="escandallos" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <span className="hidden sm:inline">Escandallos</span>
                </TabsTrigger>
              )}
              {permissions.proveedores && (
                <TabsTrigger value="proveedores" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Proveedores</span>
                </TabsTrigger>
              )}
              {permissions.cierres && (
                <TabsTrigger value="cierres" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Cierres</span>
                </TabsTrigger>
              )}
            </TabsList>

            {permissions.orders && (
              <TabsContent value="orders">
                <OrdersManagement hotelId={user.hotelId} />
              </TabsContent>
            )}

            {permissions.menu && (
              <TabsContent value="menu">
                <MenuManagement hotelId={user.hotelId} />
              </TabsContent>
            )}

            {permissions.escandallos && (
              <TabsContent value="escandallos">
                <EscandallosManagement hotelId={user.hotelId} />
              </TabsContent>
            )}

            {permissions.proveedores && (
              <TabsContent value="proveedores">
                <ProveedoresManagement hotelId={user.hotelId} />
              </TabsContent>
            )}

            {permissions.cierres && (
              <TabsContent value="cierres">
                <ClosuresManagement hotelId={user.hotelId} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
