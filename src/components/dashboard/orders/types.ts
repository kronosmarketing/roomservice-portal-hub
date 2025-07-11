
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

export interface RecipeIngredient {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  supplier_product_id?: string;
  type: 'manual' | 'supplier';
  // Additional fields for manual ingredients
  package_quantity?: number;
  package_price?: number;
}
