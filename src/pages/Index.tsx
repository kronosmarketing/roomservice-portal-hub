
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, User } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleAcceder = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleRegistrarHotel = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 flex flex-col">
      {/* Header con logo */}
      <div className="flex justify-center pt-16 pb-8">
        <div className="flex items-center">
          <Mic className="h-16 w-16 text-blue-400 bg-blue-400/20 rounded-full p-3 mr-4" />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8">
          Marjor<span className="text-orange-500">AI</span>
        </h1>
        
        <div className="max-w-4xl mb-12">
          <h2 className="text-2xl md:text-3xl text-white/90 mb-6 font-light">
            Revoluciona el room service de tu hotel con inteligencia artificial conversacional
          </h2>
          
          <p className="text-lg md:text-xl text-white/70 leading-relaxed">
            Permite a tus huéspedes hacer pedidos simplemente hablando en su idioma natural. 
            MarjorAI gestiona todo el proceso, desde la toma de pedidos hasta la entrega.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="space-y-4 w-full max-w-md">
          <Button
            onClick={handleAcceder}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6 rounded-lg font-semibold flex items-center justify-center space-x-3"
          >
            <span className="text-2xl">▶</span>
            <span>Acceder</span>
          </Button>
          
          <Button
            onClick={handleRegistrarHotel}
            variant="outline"
            className="w-full bg-transparent border-2 border-white/30 text-white hover:bg-white/10 text-lg py-6 rounded-lg font-semibold flex items-center justify-center space-x-3"
          >
            <User className="h-5 w-5" />
            <span>Registrar Hotel</span>
          </Button>
        </div>
      </div>

      {/* Modal de autenticación */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default Index;
