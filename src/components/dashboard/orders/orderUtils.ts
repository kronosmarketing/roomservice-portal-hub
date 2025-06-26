
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Order, OrderItem } from "./types";

export const formatOrderFromDatabase = (order: any, orderItems: any[]): Order => {
  console.log('🔍 Formateando pedido:', order.id.substring(0, 8), 'con items:', orderItems?.length || 0);
  console.log('📊 Order items raw:', orderItems);
  
  let itemsText = '';
  
  if (orderItems && orderItems.length > 0) {
    itemsText = orderItems
      .map(item => {
        console.log('🔍 Procesando item:', item);
        // Acceder al menu_items desde la relación
        const menuItem = item.menu_items;
        console.log('🍽️ Menu item encontrado:', menuItem);
        const itemName = menuItem?.name || 'Item desconocido';
        const quantity = item.quantity || 1;
        console.log(`  - ${quantity}x ${itemName}`);
        return `${quantity}x ${itemName}`;
      })
      .join(', ');
  } else {
    console.log('  - Sin items encontrados para pedido:', order.id.substring(0, 8));
    itemsText = 'Sin items disponibles';
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

// Utility functions for formatting and display
export const formatPrice = (price: number) => {
  return `€${price.toFixed(2)}`;
};

export const formatTime = (timestamp: string) => {
  return timestamp;
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pendiente':
      return 'border-yellow-500 text-yellow-700';
    case 'preparando':
      return 'border-blue-500 text-blue-700';
    case 'completado':
      return 'border-green-500 text-green-700';
    case 'cancelado':
      return 'border-red-500 text-red-700';
    default:
      return 'border-gray-500 text-gray-700';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pendiente':
      return '⏳';
    case 'preparando':
      return '👨‍🍳';
    case 'completado':
      return '✅';
    case 'cancelado':
      return '❌';
    default:
      return '❓';
  }
};
