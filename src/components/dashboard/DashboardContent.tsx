
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Pedidos</h1>
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
    </main>
  );
};

export default DashboardContent;
