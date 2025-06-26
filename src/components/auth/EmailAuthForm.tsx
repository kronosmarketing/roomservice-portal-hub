
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormData {
  email: string;
  password: string;
  hotelName: string;
  agentName: string;
  phoneRoomservice: string;
}

interface EmailAuthFormProps {
  mode: 'login' | 'register';
  formData: FormData;
  loading: boolean;
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const EmailAuthForm = ({ 
  mode, 
  formData, 
  loading, 
  onInputChange, 
  onSubmit 
}: EmailAuthFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === 'register' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="hotelName" className="text-white">
              Nombre del Hotel *
            </Label>
            <Input
              id="hotelName"
              value={formData.hotelName}
              onChange={(e) => onInputChange("hotelName", e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
              placeholder="Hotel Paradise"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agentName" className="text-white">
              Nombre del Agente *
            </Label>
            <Input
              id="agentName"
              value={formData.agentName}
              onChange={(e) => onInputChange("agentName", e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
              placeholder="Juan Pérez"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phoneRoomservice" className="text-white">
              Teléfono Room Service
            </Label>
            <Input
              id="phoneRoomservice"
              type="tel"
              value={formData.phoneRoomservice}
              onChange={(e) => onInputChange("phoneRoomservice", e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
              placeholder="+34 123 456 789"
            />
          </div>
        </>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">
          Correo Electrónico *
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onInputChange("email", e.target.value)}
          className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
          placeholder="admin@hotel.com"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">
          Contraseña *
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => onInputChange("password", e.target.value)}
          className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
          placeholder="••••••••"
          required
        />
      </div>
      
      <Button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        disabled={loading}
      >
        {loading ? 'Procesando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
      </Button>
    </form>
  );
};

export default EmailAuthForm;
