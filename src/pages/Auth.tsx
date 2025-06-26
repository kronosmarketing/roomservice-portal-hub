
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';
import { useEffect } from 'react';
import { Mic, Mail } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [phoneRoomservice, setPhoneRoomservice] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      let errorMessage = "Error al iniciar sesión";
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Credenciales inválidas. Verifica tu email y contraseña";
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = "Por favor confirma tu email antes de iniciar sesión";
      } else if (error.message.includes('Too many requests')) {
        errorMessage = "Demasiados intentos. Intenta de nuevo más tarde";
      }
      
      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive"
      });
    } else {
      toast({
        title: "¡Bienvenido!",
        description: "Sesión iniciada correctamente"
      });
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    if (!email || !password || !confirmPassword || !hotelName || !agentName) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Por favor, introduce un email válido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, {
      hotelName,
      agentName,
      phoneRoomservice
    });
    
    if (error) {
      let errorMessage = "Error al crear la cuenta";
      
      if (error.message.includes('User already registered')) {
        errorMessage = "Este email ya está registrado. Intenta iniciar sesión";
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres";
      } else if (error.message.includes('Unable to validate email')) {
        errorMessage = "Email inválido. Verifica el formato";
      }
      
      toast({
        title: "Error de registro",
        description: errorMessage,
        variant: "destructive"
      });
    } else {
      toast({
        title: "¡Cuenta creada!",
        description: "Revisa tu email para confirmar tu cuenta",
      });
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setHotelName('');
      setAgentName('');
      setPhoneRoomservice('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Mic className="h-16 w-16 text-blue-400 bg-blue-400/20 rounded-full p-3" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Marjor<span className="text-orange-400">AI</span>
          </h1>
          <p className="text-white/80 text-lg">
            Accede a tu panel de control
          </p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/20 border-white/30">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-white/80"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-white/80"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@hotel.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-orange-400"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-lg" 
                    disabled={loading}
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-purple-700 text-white/60">o continúa con</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
                  disabled={loading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Continuar con Google
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">Correo Electrónico *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="admin@hotel.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hotel-name" className="text-white">Nombre del Hotel *</Label>
                    <Input
                      id="hotel-name"
                      type="text"
                      placeholder="Hotel Paradise"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      disabled={loading}
                      required
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-name" className="text-white">Nombre del Responsable *</Label>
                    <Input
                      id="agent-name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      disabled={loading}
                      required
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Teléfono Room Service</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+34 123 456 789"
                      value={phoneRoomservice}
                      onChange={(e) => setPhoneRoomservice(e.target.value)}
                      disabled={loading}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white">Contraseña *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-white">Confirmar Contraseña *</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-orange-400"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-lg" 
                    disabled={loading}
                  >
                    {loading ? "Creando cuenta..." : "🏨 Registrar Hotel"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-purple-700 text-white/60">o continúa con</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
                  disabled={loading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Continuar con Google
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Botón para volver a la landing */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            ← Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
