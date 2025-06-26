
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic } from "lucide-react";
import EmailAuthForm from "./EmailAuthForm";
import OAuthButtons from "./OAuthButtons";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

const AuthModal = ({ isOpen, onClose, mode, onModeChange }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    hotelName: '',
    agentName: '',
    phoneRoomservice: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
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
        
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });

        // Cerrar modal y redirigir al dashboard
        onClose();
        navigate('/dashboard');
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 border-purple-600 text-white">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {mode === 'login' ? 'Iniciar Sesión' : 'Registrar Hotel'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 p-6">
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            <Mic className="h-16 w-16 text-blue-400 bg-blue-400/20 rounded-full p-3" />
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">
              Marjor<span className="text-orange-500">AI</span>
            </h1>
            <h2 className="text-xl mb-2">
              {mode === 'login' ? 'Iniciar Sesión' : 'Registrar Hotel'}
            </h2>
            <p className="text-white/70 text-sm">
              {mode === 'login' 
                ? 'Accede a tu panel de control de MarjorAI'
                : 'Crea tu cuenta de MarjorAI'
              }
            </p>
          </div>

          {/* Formulario de autenticación */}
          <div className="w-full space-y-4">
            <EmailAuthForm
              mode={mode}
              formData={formData}
              loading={loading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-purple-800 text-white/60">o continúa con</span>
              </div>
            </div>

            <OAuthButtons loading={loading} setLoading={setLoading} />
          </div>

          {/* Toggle entre login y registro */}
          <div className="text-center text-sm">
            <span className="text-white/60">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            </span>{' '}
            <button
              onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
