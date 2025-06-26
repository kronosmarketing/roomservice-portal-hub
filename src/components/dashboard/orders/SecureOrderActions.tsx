
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Edit, CheckCircle } from "lucide-react";
import { validateUserHotelAccess, logSecurityEvent, checkRateLimit } from "./securityUtils";
import { useToast } from "@/hooks/use-toast";

interface SecureOrderActionsProps {
  orderId: string;
  hotelId: string;
  currentStatus: string;
  onStatusUpdate: (orderId: string, newStatus: string) => Promise<void>;
  onDelete: (orderId: string) => Promise<void>;
  disabled?: boolean;
}

const SecureOrderActions = ({ 
  orderId, 
  hotelId, 
  currentStatus, 
  onStatusUpdate, 
  onDelete,
  disabled = false 
}: SecureOrderActionsProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const validateAction = async (action: string): Promise<boolean> => {
    // Rate limiting
    const rateLimitKey = `order_${action}_${orderId}`;
    if (!checkRateLimit(rateLimitKey, 10, 5)) {
      toast({
        title: "Acción bloqueada",
        description: "Demasiadas acciones en poco tiempo. Espera un momento.",
        variant: "destructive"
      });
      return false;
    }

    // Hotel access validation
    const hasAccess = await validateUserHotelAccess(hotelId);
    if (!hasAccess) {
      await logSecurityEvent('unauthorized_order_action', 'orders', orderId, {
        action,
        hotelId
      });
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para esta acción",
        variant: "destructive"
      });
      return false;
    }

    await logSecurityEvent('order_action_authorized', 'orders', orderId, {
      action,
      hotelId
    });
    return true;
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (disabled || isUpdating) return;

    const isAuthorized = await validateAction('status_update');
    if (!isAuthorized) return;

    setIsUpdating(true);
    try {
      await onStatusUpdate(orderId, newStatus);
      await logSecurityEvent('order_status_updated', 'orders', orderId, {
        oldStatus: currentStatus,
        newStatus,
        hotelId
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      await logSecurityEvent('order_status_update_error', 'orders', orderId, {
        error: String(error),
        hotelId
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (disabled || isDeleting) return;

    const isAuthorized = await validateAction('delete');
    if (!isAuthorized) return;

    setIsDeleting(true);
    try {
      await onDelete(orderId);
      await logSecurityEvent('order_deleted', 'orders', orderId, {
        hotelId,
        deletedStatus: currentStatus
      });
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      await logSecurityEvent('order_delete_error', 'orders', orderId, {
        error: String(error),
        hotelId
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getNextStatus = () => {
    switch (currentStatus) {
      case 'pendiente':
        return 'en_preparacion';
      case 'en_preparacion':
        return 'completado';
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();

  return (
    <div className="flex gap-2">
      {nextStatus && (
        <Button
          size="sm"
          onClick={() => handleStatusUpdate(nextStatus)}
          disabled={disabled || isUpdating}
          className="flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" />
          {isUpdating ? "Actualizando..." : 
            nextStatus === 'en_preparacion' ? "Preparar" : "Completar"
          }
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            disabled={disabled || isDeleting}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SecureOrderActions;
