
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersManagement from "./OrdersManagement";
import MenuManagement from "./MenuManagement";
import EscandallosManagement from "./EscandallosManagement";
import ProveedoresManagement from "./ProveedoresManagement";
import { Package, UtensilsCrossed, Calculator, Building2 } from "lucide-react";

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

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Pedidos</span>
              </TabsTrigger>
              <TabsTrigger value="menu" className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                <span className="hidden sm:inline">Menú</span>
              </TabsTrigger>
              <TabsTrigger value="escandallos" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Escandallos</span>
              </TabsTrigger>
              <TabsTrigger value="proveedores" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Proveedores</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <OrdersManagement hotelId={user.hotelId} />
            </TabsContent>

            <TabsContent value="menu">
              <MenuManagement hotelId={user.hotelId} />
            </TabsContent>

            <TabsContent value="escandallos">
              <EscandallosManagement hotelId={user.hotelId} />
            </TabsContent>

            <TabsContent value="proveedores">
              <ProveedoresManagement hotelId={user.hotelId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
