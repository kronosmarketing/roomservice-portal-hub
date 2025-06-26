
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChefHat, ClipboardList, BarChart3, Search } from "lucide-react";
import DashboardStats from "./DashboardStats";
import OrdersManagement from "./OrdersManagement";
import SearchOrders from "./SearchOrders";

interface DashboardContentProps {
  user: {
    userRole?: string;
    hotelId?: string;
    hotelName?: string;
    agentName?: string;
    email?: string;
  };
}

const DashboardContent = ({ user }: DashboardContentProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showOrderSearch, setShowOrderSearch] = useState(false);

  console.log("DashboardContent user data:", user);

  // Si estamos en búsqueda de pedidos, mostrar ese componente
  if (showOrderSearch && user.hotelId) {
    return (
      <main className="container mx-auto px-6 py-8">
        <SearchOrders 
          hotelId={user.hotelId} 
          onBack={() => setShowOrderSearch(false)}
        />
      </main>
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
            <span>Gestionar Menú</span>
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
                  onClick={() => setShowOrderSearch(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Pedidos
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
                <p><strong>Hotel:</strong> {user.hotelName || 'Mi Hotel'}</p>
                <p><strong>Agente:</strong> {user.agentName || 'Agente IA'}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Rol:</strong> {user.userRole || 'hotel_manager'}</p>
                <p><strong>Estado:</strong> <span className="text-green-400">Activo</span></p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="bg-white/10 rounded-lg p-6">
          <div className="text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Gestión de Pedidos</h2>
                <p className="text-white/70">Panel de pedidos para el hotel: {user.hotelName}</p>
              </div>
              <Button 
                onClick={() => setShowOrderSearch(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar Pedidos
              </Button>
            </div>
          </div>
          
          {user.hotelId ? (
            <OrdersManagement hotelId={user.hotelId} />
          ) : (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white/60">
                No se pudo cargar el ID del hotel. Por favor, recarga la página.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="menu" className="bg-white/10 rounded-lg p-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">Gestión de Menú</h2>
            <p className="text-white/70 mb-4">Panel de gestión de menú para el hotel: {user.hotelName}</p>
            
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
