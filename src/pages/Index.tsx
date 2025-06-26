
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "@/components/auth/AuthModal";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleAccessClick = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const handleRegisterClick = () => {
    setAuthMode('register');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">MarjorAI</h1>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Seguro
            </Badge>
          </div>
          <Button 
            variant="outline" 
            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            onClick={handleAccessClick}
          >
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 text-center">
        {/* Microphone Icon */}
        <div className="mb-12">
          <div className="w-32 h-32 bg-blue-500/30 rounded-full flex items-center justify-center mb-8 animate-[float_6s_ease-in-out_infinite] hover:scale-110 transition-transform duration-300">
            <Mic className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-6xl font-bold text-white mb-8">
          Marjor<span className="text-orange-400">AI</span>
        </h1>

        {/* Subtitle */}
        <h2 className="text-2xl text-white/90 mb-6 max-w-4xl leading-relaxed">
          Revoluciona el room service de tu hotel con inteligencia artificial conversacional
        </h2>

        {/* Description */}
        <p className="text-lg text-white/80 mb-12 max-w-3xl leading-relaxed">
          Permite a tus huéspedes hacer pedidos simplemente hablando en su idioma natural.
          MarjorAI gestiona todo el proceso, desde la toma de pedidos hasta la entrega.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-md">
          <Button 
            size="lg" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6 rounded-xl font-semibold"
            onClick={handleAccessClick}
          >
            Acceder
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full bg-transparent border-2 border-white/30 text-white hover:bg-white/10 text-lg py-6 rounded-xl font-semibold"
            onClick={handleRegisterClick}
          >
            🏨 Registrar Hotel
          </Button>
        </div>
      </main>

      {/* Footer spacer */}
      <div className="h-16"></div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default Index;
