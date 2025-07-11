
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Hash, Copy, Printer, X } from "lucide-react";
import { Order } from "./types";
import { formatPrice, formatTime, getStatusIcon } from "./orderUtils";
import { sanitizeInput } from "./securityUtils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import OrderStatusButton from "./OrderStatusButton";

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'pendiente':
      return 'bg-yellow-500 text-white border-yellow-500';
    case 'preparando':
      return 'bg-blue-500 text-white border-blue-500';
    case 'completado':
      return 'bg-green-500 text-white border-green-500';
    case 'cancelado':
      return 'bg-red-500 text-white border-red-500';
    default:
      return 'bg-gray-500 text-white border-gray-500';
  }
};

const formatItemsForDisplay = (items: string) => {
  try {
    // First try to parse as JSON array
    if (typeof items === 'string' && items.startsWith('[')) {
      const itemsArray = JSON.parse(items);
      return itemsArray.map((item: any, index: number) => (
        <div key={index} className="text-sm">
          {item.quantity && item.name 
            ? sanitizeInput(`${item.quantity}x ${item.name}`)
            : item.quantity && item.menu_item?.name
            ? sanitizeInput(`${item.quantity}x ${item.menu_item.name}`)
            : sanitizeInput(item.toString())
          }
        </div>
      ));
    }
    
    // If it's already a formatted string, split by commas or newlines
    const itemsList = items.includes('\n') ? items.split('\n') : items.split(', ');
    return itemsList.map((item: string, index: number) => (
      <div key={index} className="text-sm">
        {sanitizeInput(item.trim())}
      </div>
    ));
  } catch (error) {
    // Fallback to display as single item
    return <div className="text-sm">{sanitizeInput(items)}</div>;
  }
};

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: string) => void;
  onCancelOrder: (orderId: string) => void;
  onPrintOrder: (order: Order) => void;
  showAllActions?: boolean;
}

const OrderCard = ({ 
  order, 
  onStatusChange, 
  onCancelOrder, 
  onPrintOrder,
  showAllActions = false 
}: OrderCardProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast({
        title: "ID copiado",
        description: `ID del pedido copiado al portapapeles`,
      });
    } catch (error) {
      console.error('Error copiando ID:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el ID",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} mb-1`}>
              Habitación {sanitizeInput(order.roomNumber)}
            </CardTitle>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3 text-gray-500 flex-shrink-0" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-pointer group">
                        <span className="font-mono text-xs truncate">
                          #{order.id.substring(0, 8)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={() => copyOrderId(order.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Hacer clic para copiar ID completo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(order.timestamp)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-3">
            <Badge className={`${getStatusBadgeColor(order.status)} text-xs whitespace-nowrap`}>
              {getStatusIcon(order.status)}
              {isMobile ? order.status.charAt(0).toUpperCase() : order.status}
            </Badge>
            <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-green-600 whitespace-nowrap`}>
              {formatPrice(order.total)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          <div>
            <span className={`font-medium ${isMobile ? 'text-sm' : ''} block`}>
              {formatItemsForDisplay(order.items)}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Pago: {sanitizeInput(order.paymentMethod || 'habitacion')}
          </div>
        </div>
        
        {order.specialInstructions && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm">
              <strong>Instrucciones especiales:</strong> {sanitizeInput(order.specialInstructions)}
            </p>
          </div>
        )}
        
        <div className={`flex ${isMobile ? 'flex-row gap-2 items-center justify-start' : 'justify-between items-center'}`}>
          <div className={`flex gap-2 ${isMobile ? 'flex-row items-center' : ''}`}>
            {(showAllActions || order.status !== 'completado') && (
              <OrderStatusButton order={order} onStatusChange={onStatusChange} />
            )}
            <Button
              size="sm"
              variant="outline" 
              onClick={() => onPrintOrder(order)}
              className="flex items-center gap-1 p-2 flex-shrink-0"
            >
              <Printer className="h-4 w-4" />
              {!isMobile && "Imprimir"}
            </Button>
            {order.status !== 'completado' && order.status !== 'cancelado' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onCancelOrder(order.id)}
                className="flex items-center gap-1 p-2 flex-shrink-0"
              >
                <X className="h-4 w-4" />
                {!isMobile && "Cancelar"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
