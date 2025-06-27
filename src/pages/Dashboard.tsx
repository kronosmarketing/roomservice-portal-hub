
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
      console.log("Getting user data...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user found, redirecting to home");
        navigate('/');
        return;
      }

      console.log("User found:", user.email);
      setUser(user);
      
      try {
        // Buscar perfil en hotel_user_settings usando el email del usuario
        const { data: profile, error } = await supabase
          .from('hotel_user_settings')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching profile:", error);
          // No mostrar error al usuario para este caso
        }

        if (profile) {
          console.log("Profile found:", profile);
          setUserProfile(profile);
        } else {
          console.log("No profile found, creating new one");
          // Crear perfil si no existe
          const newProfileData = {
            email: user.email,
            hotel_name: 'Mi Hotel',
            agent_name: 'Agente IA',
            user_role: 'hotel_manager',
            is_active: true,
            auth_provider: 'email'
          };

          const { data: newProfile, error: insertError } = await supabase
            .from('hotel_user_settings')
            .insert(newProfileData)
            .select()
            .single();
          
          if (insertError) {
            console.error("Error creating profile:", insertError);
            // Crear un perfil temporal para que funcione
            setUserProfile({
              id: user.id,
              email: user.email,
              hotel_name: 'Mi Hotel',
              agent_name: 'Agente IA',
              user_role: 'hotel_manager',
              is_active: true
            });
          } else {
            console.log("New profile created:", newProfile);
            setUserProfile(newProfile);
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        // Crear un perfil temporal para que funcione
        setUserProfile({
          id: user.id,
          email: user.email,
          hotel_name: 'Mi Hotel',
          agent_name: 'Agente IA',
          user_role: 'hotel_manager',
          is_active: true
        });
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
          <p>Cargando panel...</p>
        </div>
      </div>
    );
  }

  // Asegurar que siempre tenemos datos mínimos para el dashboard
  const dashboardUser = {
    userRole: userProfile?.user_role || 'hotel_manager',
    hotelId: userProfile?.id || user?.id,
    hotelName: userProfile?.hotel_name || 'Mi Hotel',
    agentName: userProfile?.agent_name || 'Agente IA',
    email: userProfile?.email || user?.email
  };

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
              {dashboardUser.hotelName} - {dashboardUser.email}
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
