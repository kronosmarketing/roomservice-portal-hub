
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mic, Building } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    hotelName: '',
    agentName: '',
    phoneRoomservice: ''
  });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);

        if (error) throw error;

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });

        navigate('/dashboard');
      } else {
        // Validar que las contraseñas coincidan
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Las contraseñas no coinciden");
        }

        // Registro
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              hotel_name: formData.hotelName,
              agent_name: formData.agentName,
              phone_roomservice: formData.phoneRoomservice,
            }
          }
        });

        if (error) throw error;

        toast({
          title: "¡Cuenta creada!",
          description: "Revisa tu correo para verificar tu cuenta.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex flex-col items-center justify-center px-4">
      {/* Main Content */}
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-2">
            <Mic className="h-12 w-12 text-white mr-2" />
          </div>
          <h1 className="text-5xl font-bold text-white">
            Marjor<span className="text-orange-400">AI</span>
          </h1>
          <p className="text-lg text-white/90">
            {isLogin ? 'Accede a tu panel de control' : 'Registra tu hotel'}
          </p>
        </div>

        {/* Login/Register Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {/* Tab Buttons */}
          <div className="flex mb-6 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                isLogin 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                !isLogin 
                  ? 'bg-orange-500 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">
                Correo Electrónico *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl"
                placeholder="admin@hotel.com"
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hotelName" className="text-white font-medium">
                    Nombre del Hotel *
                  </Label>
                  <Input
                    id="hotelName"
                    value={formData.hotelName}
                    onChange={(e) => handleInputChange("hotelName", e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl"
                    placeholder="Hotel Paradise"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentName" className="text-white font-medium">
                    Nombre del Responsable *
                  </Label>
                  <Input
                    id="agentName"
                    value={formData.agentName}
                    onChange={(e) => handleInputChange("agentName", e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneRoomservice" className="text-white font-medium">
                    Teléfono Room Service
                  </Label>
                  <Input
                    id="phoneRoomservice"
                    type="tel"
                    value={formData.phoneRoomservice}
                    onChange={(e) => handleInputChange("phoneRoomservice", e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl"
                    placeholder="+34 123 456 789"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium">
                Contraseña *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">
                  Confirmar Contraseña *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 rounded-xl font-semibold text-lg mt-6"
              disabled={loading}
            >
              {loading ? 'Procesando...' : (
                <div className="flex items-center justify-center">
                  {!isLogin && <Building className="h-5 w-5 mr-2" />}
                  {isLogin ? 'Iniciar Sesión' : 'Registrar Hotel'}
                </div>
              )}
            </Button>
          </form>

          {isLogin && (
            <>
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-purple-700 text-white/60">o continúa con</span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 rounded-xl"
                  disabled={loading}
                >
                  Continuar con Google
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 rounded-xl"
                  disabled={loading}
                >
                  Continuar con Microsoft
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
