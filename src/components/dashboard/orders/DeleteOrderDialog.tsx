
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
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [foundOrder, setFoundOrder] = useState<any>(null);
  const { toast } = useToast();

  const searchOrder = async () => {
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
      // Buscar el pedido completo o por los primeros 8 caracteres
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, room_number, total, status, created_at')
        .eq('hotel_id', hotelId)
        .or(`id.eq.${orderId},id.like.${orderId}%`);

      if (error) {
        throw error;
      }

      if (!orders || orders.length === 0) {
        toast({
          title: "Pedido no encontrado",
          description: "No se encontró ningún pedido con ese ID",
          variant: "destructive"
        });
        return;
      }

      if (orders.length > 1) {
        toast({
          title: "Múltiples pedidos",
          description: "Se encontraron múltiples pedidos. Usa el ID completo.",
          variant: "destructive"
        });
        return;
      }

      // Mostrar confirmación
      setFoundOrder(orders[0]);
      setConfirmationStep(true);

    } catch (error) {
      console.error('Error buscando pedido:', error);
      toast({
        title: "Error",
        description: "Error al buscar el pedido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async () => {
    if (!foundOrder) return;
    
    setLoading(true);
    try {
      // Usar la función de base de datos para eliminar el pedido y sus items
      const { error } = await supabase.rpc('delete_order_with_items', {
        order_id_param: foundOrder.id,
        hotel_id_param: hotelId
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado completamente de la base de datos",
      });

      onOrderDeleted(foundOrder.id);
      handleClose();

    } catch (error) {
      console.error('Error eliminando pedido:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOrderId("");
    setConfirmationStep(false);
    setFoundOrder(null);
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

        {!confirmationStep ? (
          <div className="space-y-4">
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
                onClick={searchOrder}
                disabled={loading || !orderId.trim()}
                className="flex-1"
              >
                {loading ? 'Buscando...' : 'Buscar Pedido'}
              </Button>
            </div>
          </div>
        ) : (
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

            {foundOrder && (
              <div className="bg-gray-50 p-3 rounded border space-y-2">
                <p className="text-sm">
                  <strong>ID:</strong> <span className="font-mono">{foundOrder.id}</span>
                </p>
                <p className="text-sm">
                  <strong>Habitación:</strong> {foundOrder.room_number}
                </p>
                <p className="text-sm">
                  <strong>Total:</strong> €{parseFloat(foundOrder.total).toFixed(2)}
                </p>
                <p className="text-sm">
                  <strong>Estado:</strong> {foundOrder.status}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setConfirmationStep(false)}
                className="flex-1"
              >
                Volver
              </Button>
              <Button 
                onClick={deleteOrder}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? 'Eliminando...' : 'Eliminar Definitivamente'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeleteOrderDialog;
