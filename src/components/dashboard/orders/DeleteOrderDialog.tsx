
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash, AlertTriangle } from "lucide-react";
import { validateOrderId, sanitizeInput } from "@/utils/inputValidation";

interface DeleteOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  onOrderDeleted: (orderId: string) => void;
}

const DeleteOrderDialog = ({ isOpen, onClose, hotelId, onOrderDeleted }: DeleteOrderDialogProps) => {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const deleteOrder = async () => {
    const sanitizedOrderId = sanitizeInput(orderId);
    
    if (!sanitizedOrderId) {
      toast({
        title: "Error",
        description: "Por favor, introduce un ID de pedido",
        variant: "destructive"
      });
      return;
    }

    // Validate order ID format for security
    if (!validateOrderId(sanitizedOrderId)) {
      toast({
        title: "Error",
        description: "Formato de ID de pedido inválido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log('🗑️ Iniciando eliminación de pedido:', sanitizedOrderId, 'para hotel:', hotelId);
    
    try {
      // Use the secure database function that validates hotel ownership
      const { error } = await supabase.rpc('delete_order_with_items', {
        order_id_param: sanitizedOrderId,
        hotel_id_param: hotelId
      });

      if (error) {
        console.error('❌ Error de la función delete_order_with_items:', error);
        throw error;
      }

      console.log('✅ Pedido eliminado exitosamente');
      
      toast({
        title: "Pedido eliminado",
        description: `El pedido #${sanitizedOrderId.substring(0, 8)} ha sido eliminado completamente`,
      });

      // Notify parent component to update the list
      onOrderDeleted(sanitizedOrderId);
      handleClose();

    } catch (error: any) {
      console.error('❌ Error eliminando pedido:', error);
      
      let errorMessage = "No se pudo eliminar el pedido.";
      
      if (error.message) {
        if (error.message.includes('no encontrado') || error.message.includes('not found')) {
          errorMessage = `No se encontró el pedido con ID: ${sanitizedOrderId.substring(0, 8)}`;
        } else if (error.message.includes('Access denied') || error.message.includes('Hotel ID mismatch')) {
          errorMessage = "No tienes permiso para eliminar este pedido";
        } else if (error.message.includes('Invalid order ID format')) {
          errorMessage = "Formato de ID de pedido inválido";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error al eliminar",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOrderId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash className="h-5 w-5" />
            Eliminar Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-800">¡Advertencia!</p>
              <p className="text-red-700 mt-1">
                Esta acción eliminará permanentemente el pedido y todos sus items de la base de datos. 
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderId">ID del Pedido</Label>
            <Input
              id="orderId"
              placeholder="Introduce el ID completo o los primeros 8 caracteres"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="font-mono"
              disabled={loading}
              maxLength={255}
            />
            <p className="text-sm text-gray-500">
              Puedes usar el ID completo o solo los primeros 8 caracteres (ej: a1b2c3d4)
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={deleteOrder}
              disabled={loading || !orderId.trim()}
              variant="destructive"
              className="flex-1"
            >
              {loading ? 'Eliminando...' : 'Eliminar Pedido'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteOrderDialog;
