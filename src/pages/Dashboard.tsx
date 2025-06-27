
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Mic } from "lucide-react";
import DashboardContent from "@/components/dashboard/DashboardContent";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      console.log("🔄 Obteniendo datos del usuario...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("❌ Usuario no encontrado, redirigiendo...");
        navigate('/');
        return;
      }

      console.log("✅ Usuario autenticado:", user.email);
      setUser(user);
      
      // Buscar perfil del usuario en la tabla correcta
      const { data: profile, error } = await supabase
        .from('hotel_user_settings')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error("❌ Error obteniendo perfil:", error);
        toast({
          title: "Error",
          description: "Error obteniendo perfil de usuario: " + error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!profile) {
        console.log("🔄 Perfil no encontrado, creando uno nuevo...");
        // Crear perfil básico si no existe
        const { data: newProfile, error: insertError } = await supabase
          .from('hotel_user_settings')
          .insert({
            email: user.email,
            hotel_name: 'Mi Hotel',
            agent_name: 'Agente IA',
            user_role: 'hotel_manager',
            is_active: true,
            auth_provider: 'email'
          })
          .select()
          .single();
        
        if (insertError) {
          console.error("❌ Error creando perfil:", insertError);
          toast({
            title: "Error",
            description: "Error creando perfil de usuario: " + insertError.message,
            variant: "destructive",
          });
        } else {
          console.log("✅ Perfil creado exitosamente");
          setUserProfile(newProfile);
        }
      } else {
        console.log("✅ Perfil encontrado:", profile.hotel_name);
        setUserProfile(profile);
      }
      
      setLoading(false);
    };

    getUser();
  }, [navigate, toast]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 flex items-center justify-center">
        <div className="text-white text-center">
          <Mic className="h-16 w-16 text-blue-400 bg-blue-400/20 rounded-full p-3 mx-auto mb-4 animate-pulse" />
          <p>Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Error de configuración</h1>
          <p>No se pudo cargar el perfil del usuario</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const dashboardUser = {
    userRole: userProfile.user_role || 'hotel_manager',
    hotelId: userProfile.id,
    hotelName: userProfile.hotel_name || 'Mi Hotel',
    agentName: userProfile.agent_name || 'Agente IA',
    email: userProfile.email || user?.email || ''
  };

  console.log('🏨 Datos del dashboard:', {
    hotelId: dashboardUser.hotelId,
    hotelName: dashboardUser.hotelName,
    email: dashboardUser.email
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Mic className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">
              Marjor<span className="text-orange-500">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-white/80">
              {dashboardUser.hotelName}
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-transparent border-white/30 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido del dashboard */}
      <DashboardContent user={dashboardUser} />
    </div>
  );
};

export default Dashboard;
