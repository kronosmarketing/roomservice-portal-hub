
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ClosureConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const ClosureConfirmation = ({ onConfirm, onCancel, loading }: ClosureConfirmationProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-red-800">¿Confirmar CIERRE Z?</p>
          <p className="text-red-700 mt-1">
            Esta acción archivará TODOS los pedidos completados y cancelados del día, 
            generará automáticamente el informe Z final y NO SE PUEDE DESHACER.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          {loading ? 'Procesando...' : 'CONFIRMAR CIERRE Z'}
        </Button>
      </div>
    </div>
  );
};

export default ClosureConfirmation;
