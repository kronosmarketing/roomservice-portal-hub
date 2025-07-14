
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Mic } from "lucide-react";
import DashboardContent from "@/components/dashboard/DashboardContent";
import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";

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
        console.log("Fetching user profile for:", user.email);
        
        // Buscar perfil del usuario usando email match para evitar problemas de RLS
        const { data: profile, error } = await supabase
          .from('hotel_user_settings')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          
          // Si no existe el perfil, crear uno nuevo
          if (error.code === 'PGRST116') {
            console.log("No profile found, creating one...");
            
            const newProfileData = {
              email: user.email,
              hotel_name: 'Mi Hotel',
              agent_name: user.email?.split('@')[0] || 'Agente IA',
              user_role: 'hotel_manager' as const,
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
            } else {
              console.log("New profile created:", newProfile);
              setUserProfile(newProfile);
            }
          }
        } else if (profile) {
          console.log("Profile found:", profile.email, "with role:", profile.user_role);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
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

  // Usar el perfil encontrado o crear uno temporal
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
        <div className="container mx-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              <h1 className="text-lg sm:text-2xl font-bold text-white">
                Marjor<span className="text-orange-500">AI</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-white/80 text-xs sm:text-sm hidden sm:block">
                {dashboardUser.hotelName} - {dashboardUser.email}
              </span>
              <span className="text-white/80 text-xs sm:hidden">
                {dashboardUser.hotelName}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 text-xs sm:text-sm"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido del dashboard */}
          {/* Check if user is super admin */}
          {dashboardUser.userRole === 'super_admin' ? (
            <SuperAdminDashboard />
          ) : (
            <DashboardContent user={dashboardUser} />
          )}
    </div>
  );
};

export default Dashboard;
