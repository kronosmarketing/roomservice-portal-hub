
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, ClipboardList } from "lucide-react";

interface DashboardContentProps {
  user: {
    userRole?: string;
    hotelId?: string;
  };
}

const DashboardContent = ({ user }: DashboardContentProps) => {
  const [activeTab, setActiveTab] = useState("orders");

  if (!user.hotelId) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-white/70 text-center">Cargando panel...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
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

        <TabsContent value="orders" className="bg-white/10 rounded-lg p-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">Gestión de Pedidos</h2>
            <p className="text-white/70">Panel de pedidos para el hotel ID: {user.hotelId}</p>
            <p className="text-white/70">Rol de usuario: {user.userRole}</p>
          </div>
        </TabsContent>

        <TabsContent value="menu" className="bg-white/10 rounded-lg p-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">Gestión de Menú</h2>
            <p className="text-white/70">Panel de gestión de menú para el hotel ID: {user.hotelId}</p>
            <p className="text-white/70">Rol de usuario: {user.userRole}</p>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default DashboardContent;
