
export interface Order {
  id: string;
  roomNumber: string;
  items: string;
  total: number;
  status: 'pendiente' | 'preparando' | 'completado' | 'cancelado';
  timestamp: string;
  paymentMethod: string;
  specialInstructions?: string;
  notes?: string;
}

export interface DayStats {
  totalFinalizados: number;
  ventasDelDia: number;
  platosDisponibles: number;
  totalPlatos: number;
  porcentajeVentasAnterior?: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  menu_item: {
    id: string;
    name: string;
    price: number;
  };
}
