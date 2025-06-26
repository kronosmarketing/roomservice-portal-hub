
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChefHat, ClipboardList, BarChart3 } from "lucide-react";
import DashboardStats from "./DashboardStats";

interface DashboardContentProps {
  user: {
    userRole?: string;
    hotelId?: string;
  };
}

const DashboardContent = ({ user }: DashboardContentProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!user.hotelId) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white/10 rounded-lg p-8 text-center">
          <p className="text-white/70 text-lg">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Panel de Control</h1>
        <p className="text-white/70">Gestiona tu hotel y pedidos desde aquí</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
          <TabsTrigger 
            value="dashboard" 
            className="flex items-center space-x-2 text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="flex items-center space-x-2 text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            <ClipboardList className="h-4 w-4" />
            <span>Pedidos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="menu" 
            className="flex items-center space-x-2 text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            <ChefHat className="h-4 w-4" />
            <span>Gestión de Menú</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DashboardStats hotelId={user.hotelId} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => setActiveTab("orders")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Ver Pedidos
                </Button>
                <Button 
                  onClick={() => setActiveTab("menu")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <ChefHat className="h-4 w-4 mr-2" />
                  Gestionar Menú
                </Button>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Información del Hotel</h3>
              <div className="space-y-2 text-white/80">
                <p><strong>Hotel ID:</strong> {user.hotelId}</p>
                <p><strong>Rol:</strong> {user.userRole || 'No definido'}</p>
                <p><strong>Estado:</strong> <span className="text-green-400">Activo</span></p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="bg-white/10 rounded-lg p-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">Gestión de Pedidos</h2>
            <p className="text-white/70 mb-4">Panel de pedidos para el hotel ID: {user.hotelId}</p>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white/60">
                Aquí aparecerán todos los pedidos del hotel. 
                Esta funcionalidad se implementará en la siguiente fase.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="menu" className="bg-white/10 rounded-lg p-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">Gestión de Menú</h2>
            <p className="text-white/70 mb-4">Panel de gestión de menú para el hotel ID: {user.hotelId}</p>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white/60">
                Aquí podrás agregar, editar y eliminar items del menú. 
                Esta funcionalidad se implementará en la siguiente fase.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default DashboardContent;
