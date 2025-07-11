
export interface ClosureData {
  fecha: string;
  hora: string;
  hotel_name: string;
  totalPedidos: number;
  pedidosCompletados: number;
  pedidosCancelados: number;
  pedidosEliminados: number;
  totalDinero: number;
  metodosDetalle: Record<string, { cantidad: number; total: number }>;
  timestamp: string;
}

export interface ClosureInfo {
  totalPedidos: number;
  pedidosCompletados: number;
  pedidosCancelados: number;
  pedidosEliminados: number;
  totalDinero: number;
  metodosDetalle: Record<string, { cantidad: number; total: number }>;
}
