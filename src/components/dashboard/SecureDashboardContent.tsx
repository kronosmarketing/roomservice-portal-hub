
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, UtensilsCrossed } from "lucide-react";
import { validateUserHotelAccess } from "./orders/security/authValidation";
import { logSecurityEvent } from "./orders/security/securityLogging";
import { useToast } from "@/hooks/use-toast";
import SecurityAuditLogger from "./orders/SecurityAuditLogger";
import EnhancedSecurityValidation from "./orders/EnhancedSecurityValidation";
import OrdersManagement from "./orders/OrdersManagement";
import SecureMenuManagement from "./SecureMenuManagement";

interface DashboardUser {
  userRole: string;
  hotelId: string;
  hotelName: string;
  agentName: string;
  email: string;
}

interface SecureDashboardContentProps {
  user: DashboardUser;
}

const SecureDashboardContent = ({ user }: SecureDashboardContentProps) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    validateDashboardAccess();
  }, [user.hotelId]);

  const validateDashboardAccess = async () => {
    try {
      const accessValid = await validateUserHotelAccess(user.hotelId);
      
      if (!accessValid) {
        await logSecurityEvent('unauthorized_dashboard_access', 'dashboard', user.hotelId, {
          userEmail: user.email,
          attemptedHotel: user.hotelName
        });
        
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder a este panel de control",
          variant: "destructive"
        });
        setHasAccess(false);
      } else {
        await logSecurityEvent('dashboard_access_granted', 'dashboard', user.hotelId, {
          userEmail: user.email,
          hotelName: user.hotelName
        });
        setHasAccess(true);
      }
    } catch (error) {
      console.error('Error validating dashboard access:', error);
      await logSecurityEvent('dashboard_access_error', 'dashboard', user.hotelId, {
        error: String(error),
        userEmail: user.email
      });
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Validando permisos de acceso...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Acceso Denegado</h1>
          <p className="text-xl mb-4">No tienes permisos para acceder a este panel</p>
          <p className="text-sm opacity-75">Si crees que esto es un error, contacta al administrador</p>
        </div>
      </div>
    );
  }

  return (
    <SecurityAuditLogger 
      hotelId={user.hotelId} 
      component="dashboard" 
      action="dashboard_loaded"
      details={{ hotelName: user.hotelName, userRole: user.userRole }}
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-2xl p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Panel de Control Seguro - {user.hotelName}
              </h1>
              <p className="text-gray-600">
                Bienvenido, {user.agentName} • {user.email}
              </p>
            </div>

            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Pedidos
                </TabsTrigger>
                <TabsTrigger value="menu" className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Gestión de Menú
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                <EnhancedSecurityValidation 
                  hotelId={user.hotelId} 
                  operation="orders_management"
                >
                  {(isAuthorized) => 
                    isAuthorized ? (
                      <OrdersManagement hotelId={user.hotelId} />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No tienes permisos para gestionar pedidos</p>
                      </div>
                    )
                  }
                </EnhancedSecurityValidation>
              </TabsContent>

              <TabsContent value="menu">
                <EnhancedSecurityValidation 
                  hotelId={user.hotelId} 
                  operation="menu_management"
                >
                  {(isAuthorized) =>
                    isAuthorized ? (
                      <SecureMenuManagement hotelId={user.hotelId} />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No tienes permisos para gestionar el menú</p>
                      </div>
                    )
                  }
                </EnhancedSecurityValidation>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </SecurityAuditLogger>
  );
};

export default SecureDashboardContent;
