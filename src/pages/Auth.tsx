
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import EmailAuthForm from "@/components/auth/EmailAuthForm";

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
      if (mode === 'login') {
        // Login
        const { error } = await signIn(formData.email, formData.password);

        if (error) throw error;

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });

        navigate('/dashboard');
      } else {
        // Register
        const userData = {
          hotel_name: formData.hotelName,
          agent_name: formData.agentName,
          phone_roomservice: formData.phoneRoomservice,
        };

        const { error } = await signUp(formData.email, formData.password, userData);

        if (error) throw error;

        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada. Puedes iniciar sesión ahora.",
        });

        // Switch to login mode after successful registration
        setMode('login');
        setFormData(prev => ({ 
          ...prev, 
          password: '',
          hotelName: '', 
          agentName: '', 
          phoneRoomservice: '' 
        }));
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
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-white">
            Marjor<span className="text-orange-400">AI</span>
          </h1>
          <p className="text-xl text-white/90">
            {mode === 'login' ? 'Accede a tu panel de control' : 'Crea tu cuenta'}
          </p>
        </div>

        {/* Auth Form Container */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {/* Tab Buttons */}
          <div className="flex mb-6 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                mode === 'login' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                mode === 'register' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Email Auth Form */}
          <EmailAuthForm
            mode={mode}
            formData={formData}
            loading={loading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
