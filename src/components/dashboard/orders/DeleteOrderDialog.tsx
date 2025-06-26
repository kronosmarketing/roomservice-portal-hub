
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash, AlertTriangle } from "lucide-react";

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
    if (!orderId.trim()) {
      toast({
        title: "Error",
        description: "Por favor, introduce un ID de pedido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Usar la función de base de datos para eliminar el pedido y sus items
      const { error } = await supabase.rpc('delete_order_with_items', {
        order_id_param: orderId.trim(),
        hotel_id_param: hotelId
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado completamente de la base de datos",
      });

      onOrderDeleted(orderId);
      handleClose();

    } catch (error) {
      console.error('Error eliminando pedido:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido. Verifica que el ID sea correcto.",
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
            />
            <p className="text-sm text-gray-500">
              Puedes usar el ID completo o solo los primeros 8 caracteres (ej: a1b2c3d4)
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
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
