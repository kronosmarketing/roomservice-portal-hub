
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, Clock, Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">RoomService Portal</h1>
            <Badge variant="secondary">Seguro</Badge>
          </div>
          <Link to="/auth">
            <Button>Iniciar Sesión</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Gestiona tu servicio de habitaciones
            <span className="text-blue-600"> de forma segura</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Plataforma completa para hoteles que quieren ofrecer un servicio de habitaciones
            eficiente, seguro y moderno con autenticación robusta y protección de datos.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Comenzar Ahora
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Seguridad Avanzada</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Autenticación robusta, validación de entrada y políticas de seguridad
                a nivel de base de datos para proteger tus datos.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-green-200 transition-colors">
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Gestión Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Administra menús, pedidos y reportes desde una interfaz
                intuitiva y moderna.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-200 transition-colors">
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Tiempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Recibe y gestiona pedidos en tiempo real con actualizaciones
                instantáneas del estado.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-orange-200 transition-colors">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Multi-usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Acceso seguro multi-usuario con control de permisos
                granular por hotel.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Security Features */}
        <div className="bg-white rounded-lg p-8 shadow-lg mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">Características de Seguridad</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Autenticación Robusta</h4>
                  <p className="text-gray-600">Sistema de login seguro con validación de email y gestión de sesiones</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Validación de Entrada</h4>
                  <p className="text-gray-600">Sanitización y validación de todos los datos de entrada</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Políticas RLS</h4>
                  <p className="text-gray-600">Seguridad a nivel de base de datos con Row Level Security</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Webhooks Seguros</h4>
                  <p className="text-gray-600">Integración externa con validación de archivos y timeouts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Aislamiento de Datos</h4>
                  <p className="text-gray-600">Cada hotel solo accede a sus propios datos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Validación de Permisos</h4>
                  <p className="text-gray-600">Verificación de autorización en cada operación</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-2xl">¿Listo para comenzar?</CardTitle>
              <CardDescription className="text-blue-100">
                Únete a los hoteles que ya confían en nuestra plataforma segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Crear Cuenta Gratis
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
