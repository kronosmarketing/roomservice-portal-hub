
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mic } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [phoneRoomservice, setPhoneRoomservice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setHotelName("");
    setAgentName("");
    setPhoneRoomservice("");
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Registro
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              hotel_name: hotelName,
              agent_name: agentName,
              phone_roomservice: phoneRoomservice,
            }
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: "Usuario ya registrado",
              description: "Este email ya está registrado. Intenta iniciar sesión.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada. Puedes iniciar sesión ahora.",
        });
        
        // Cambiar a modo login después del registro exitoso
        setIsSignUp(false);
        resetForm();
      } else {
        // Inicio de sesión
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Credenciales inválidas",
              description: "Email o contraseña incorrectos.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });
        
        onSuccess();
        onClose();
        resetForm();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeToggle = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2">
              <Mic className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                Marjor<span className="text-orange-500">AI</span>
              </span>
            </div>
          </div>
          <DialogTitle className="text-center">
            {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="hotelName">Nombre del Hotel</Label>
                <Input
                  id="hotelName"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  required
                  placeholder="Hotel Ejemplo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentName">Nombre del Agente</Label>
                <Input
                  id="agentName"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  required
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneRoomservice">Teléfono Room Service (opcional)</Label>
                <Input
                  id="phoneRoomservice"
                  value={phoneRoomservice}
                  onChange={(e) => setPhoneRoomservice(e.target.value)}
                  placeholder="+34 123 456 789"
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Procesando..." : (isSignUp ? "Crear cuenta" : "Iniciar sesión")}
          </Button>
        </form>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={handleModeToggle}
            className="text-sm"
          >
            {isSignUp 
              ? "¿Ya tienes cuenta? Inicia sesión" 
              : "¿No tienes cuenta? Regístrate"
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
