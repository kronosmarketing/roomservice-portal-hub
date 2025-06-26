
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Order, OrderItem } from "./types";

export const formatOrderFromDatabase = (order: any, orderItems: OrderItem[]): Order => {
  const itemsText = orderItems
    .map(item => `${item.quantity}x ${item.menu_item.name}`)
    .join(', ');

  return {
    id: order.id,
    roomNumber: order.room_number,
    items: itemsText,
    total: parseFloat(order.total),
    status: order.status,
    timestamp: format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: es }),
    paymentMethod: order.payment_method || 'habitacion',
    specialInstructions: order.special_instructions,
    notes: order.notes
  };
};

export const formatOrderFromOrdersWithItems = (order: any): Order => {
  const items = order.items || [];
  const itemsText = items
    .map((item: any) => `${item.quantity}x ${item.name}`)
    .join(', ');

  return {
    id: order.id,
    roomNumber: order.room_number,
    items: itemsText,
    total: parseFloat(order.total),
    status: order.status,
    timestamp: format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: es }),
    paymentMethod: order.payment_method || 'habitacion',
    specialInstructions: order.special_instructions,
    notes: order.notes
  };
};

export const formatArchivedOrderFromDatabase = (order: any): Order => {
  return {
    id: order.original_order_id,
    roomNumber: order.room_number,
    items: order.items,
    total: parseFloat(order.total),
    status: order.status,
    timestamp: format(new Date(order.original_created_at), "dd/MM/yyyy HH:mm", { locale: es }),
    paymentMethod: order.payment_method || 'habitacion',
    specialInstructions: order.special_instructions,
    notes: order.notes
  };
};
