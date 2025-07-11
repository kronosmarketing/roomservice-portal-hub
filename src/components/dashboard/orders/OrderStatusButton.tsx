
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Order } from "./types";

interface OrderStatusButtonProps {
  order: Order;
  onStatusChange: (orderId: string, status: string) => void;
}

const OrderStatusButton = ({ order, onStatusChange }: OrderStatusButtonProps) => {
  const nextStatus = {
    'pendiente': 'preparando',
    'preparando': 'completado',
    'completado': 'completado'
  };

  const statusLabels = {
    'pendiente': 'Preparando',
    'preparando': 'Completado',
    'completado': 'Completado'
  };

  const statusColors = {
    'pendiente': 'bg-yellow-500 hover:bg-yellow-600',
    'preparando': 'bg-blue-500 hover:bg-blue-600',
    'completado': 'bg-green-500'
  };

  if (order.status === 'completado') {
    return (
      <Button size="sm" className={statusColors[order.status]} disabled>
        <CheckCircle className="h-4 w-4 mr-1" />
        Completado
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className={`${statusColors[order.status]} text-white`}
      onClick={() => onStatusChange(order.id, nextStatus[order.status as keyof typeof nextStatus])}
    >
      {order.status === 'pendiente' ? (
        <Clock className="h-4 w-4 mr-1" />
      ) : (
        <AlertCircle className="h-4 w-4 mr-1" />
      )}
      {statusLabels[order.status as keyof typeof statusLabels]}
    </Button>
  );
};

export default OrderStatusButton;
