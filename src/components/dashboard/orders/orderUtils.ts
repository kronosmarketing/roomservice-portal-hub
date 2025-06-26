
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Order, OrderItem } from "./types";

export const formatOrderFromDatabase = (order: any, orderItems: OrderItem[]): Order => {
  const itemsText = orderItems
    .map(item => {
      const itemName = item.menu_item?.name || 'Item desconocido';
      return `${item.quantity}x ${itemName}`;
    })
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
  let itemsText = '';
  
  if (order.items && Array.isArray(order.items)) {
    itemsText = order.items
      .map((item: any) => {
        const itemName = item.name || item.menu_item?.name || 'Item desconocido';
        const quantity = item.quantity || 1;
        return `${quantity}x ${itemName}`;
      })
      .join(', ');
  } else if (typeof order.items === 'string') {
    itemsText = order.items;
  } else {
    itemsText = 'Items no disponibles';
  }

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
