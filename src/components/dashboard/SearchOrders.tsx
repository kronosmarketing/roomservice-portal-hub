
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Calendar, MapPin, Package, Hash, Copy } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Order } from "./orders/types";
import { 
  formatArchivedOrderFromDatabase, 
  formatOrderFromOrdersWithItems,
  formatOrderFromDatabase
} from "./orders/orderUtils";

interface SearchOrdersProps {
  hotelId: string;
  onBack: () => void;
}

const SearchOrders = ({ hotelId, onBack }: SearchOrdersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [filteredArchivedOrders, setFilteredArchivedOrders] = useState<Order[]>([]);
  const [filteredTodayOrders, setFilteredTodayOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (hotelId) {
      loadOrders();
    }
  }, [hotelId]);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, dateFilter, roomFilter, idFilter, archivedOrders, todayOrders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando pedidos para búsqueda, hotel:', hotelId);

      // Cargar pedidos archivados
      const { data: archivedData, error: archivedError } = await supabase
        .from('archived_orders')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('original_created_at', { ascending: false });

      if (archivedError) {
        console.error('Error cargando pedidos archivados:', archivedError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los pedidos archivados",
          variant: "destructive"
        });
      } else {
        console.log('📋 Pedidos archivados cargados:', archivedData?.length);
        const formattedArchived = archivedData?.map(formatArchivedOrderFromDatabase) || [];
        setArchivedOrders(formattedArchived);
      }

      // Cargar pedidos de hoy usando la nueva vista orders_with_items
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayData, error: todayError } = await supabase
        .from('orders_with_items')
        .select('*')
        .eq('hotel_id', hotelId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false });

      if (todayError) {
        console.error('Error cargando pedidos de hoy:', todayError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los pedidos de hoy",
          variant: "destructive"
        });
        
        // Fallback: cargar desde la tabla orders normal
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .select('*')
          .eq('hotel_id', hotelId)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('created_at', { ascending: false });

        if (!fallbackError && fallbackData) {
          console.log('📋 Pedidos de hoy cargados (fallback):', fallbackData.length);
          const formattedTodayPromises = fallbackData.map(async order => {
            const { data: orderItems } = await supabase
              .from('order_items')
              .select(`
                id,
                quantity,
                menu_item:menu_item_id (
                  id,
                  name,
                  price
                )
              `)
              .eq('order_id', order.id);
            
            return formatOrderFromDatabase(order, orderItems || []);
          });
          
          const formattedToday = await Promise.all(formattedTodayPromises);
          setTodayOrders(formattedToday);
        }
      } else {
        console.log('📋 Pedidos de hoy cargados (vista):', todayData?.length);
        const formattedToday = todayData?.map(formatOrderFromOrdersWithItems) || [];
        setTodayOrders(formattedToday);
      }

    } catch (error) {
      console.error('Error general cargando pedidos:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar pedidos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filteredArchived = archivedOrders;
    let filteredToday = todayOrders;

    // Filtro por término general
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const filterOrder = (order: Order) => {
        return (
          order.id.toLowerCase().includes(searchLower) ||
          order.roomNumber.toLowerCase().includes(searchLower) ||
          order.items.toLowerCase().includes(searchLower) ||
          order.timestamp.toLowerCase().includes(searchLower) ||
          order.paymentMethod.toLowerCase().includes(searchLower) ||
          order.status.toLowerCase().includes(searchLower) ||
          (order.specialInstructions && order.specialInstructions.toLowerCase().includes(searchLower))
        );
      };
      filteredArchived = filteredArchived.filter(filterOrder);
      filteredToday = filteredToday.filter(filterOrder);
    }

    // Filtro por fecha
    if (dateFilter.trim()) {
      const filterByDate = (order: Order) => {
        return order.timestamp.includes(dateFilter);
      };
      filteredArchived = filteredArchived.filter(filterByDate);
      filteredToday = filteredToday.filter(filterByDate);
    }

    // Filtro por habitación
    if (roomFilter.trim()) {
      const roomLower = roomFilter.toLowerCase();
      const filterByRoom = (order: Order) => {
        return order.roomNumber.toLowerCase().includes(roomLower);
      };
      filteredArchived = filteredArchived.filter(filterByRoom);
      filteredToday = filteredToday.filter(filterByRoom);
    }

    // Filtro por ID
    if (idFilter.trim()) {
      const idLower = idFilter.toLowerCase();
      const filterById = (order: Order) => {
        return order.id.toLowerCase().includes(idLower);
      };
      filteredArchived = filteredArchived.filter(filterById);
      filteredToday = filteredToday.filter(filterById);
    }

    setFilteredArchivedOrders(filteredArchived);
    setFilteredTodayOrders(filteredToday);
  };

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast({
        title: "ID copiado",
        description: `ID del pedido ${orderId.substring(0, 8)}... copiado al portapapeles`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparando":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "listo":
        return "bg-green-100 text-green-800 border-green-200";
      case "entregado":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 group">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="font-mono text-sm font-medium">
                  #{order.id.substring(0, 8)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyOrderId(order.id)}
                  title="Copiar ID completo"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Hab. {order.roomNumber}</span>
              </div>
              <Badge variant="outline" className={getStatusColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{order.timestamp}</span>
            </div>
            
            <div className="flex items-start gap-1">
              <Package className="h-4 w-4 text-gray-500 mt-0.5" />
              <span className="text-sm">{order.items}</span>
            </div>
            
            {order.specialInstructions && (
              <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border">
                <strong>Instrucciones:</strong> {order.specialInstructions}
              </div>
            )}
          </div>
          
          <div className="text-right space-y-1">
            <div className="text-lg font-bold text-green-600">
              €{order.total.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              {order.paymentMethod}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-white">Búsqueda de Pedidos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Búsqueda general</label>
              <Input
                placeholder="Buscar en todos los campos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fecha</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Habitación</label>
              <Input
                placeholder="Ej: 101, 205..."
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ID del pedido</label>
              <Input
                placeholder="ID completo o parcial..."
                value={idFilter}
                onChange={(e) => setIdFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setSearchTerm("");
                setDateFilter("");
                setRoomFilter("");
                setIdFilter("");
              }}
              variant="outline"
            >
              Limpiar filtros
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Puedes usar múltiples filtros a la vez. Pasa el cursor sobre el ID del pedido para ver el botón de copiar.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">
            Pedidos de Hoy ({filteredTodayOrders.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Pedidos Archivados ({filteredArchivedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos de Hoy</CardTitle>
              <p className="text-sm text-gray-600">
                Pedidos realizados en el día actual
              </p>
            </CardHeader>
            <CardContent>
              {filteredTodayOrders.length > 0 ? (
                <div className="space-y-4">
                  {filteredTodayOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || dateFilter || roomFilter || idFilter ? 
                    'No se encontraron pedidos que coincidan con los filtros' : 
                    'No hay pedidos para hoy'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Archivados</CardTitle>
              <p className="text-sm text-gray-600">
                Pedidos archivados de días anteriores
              </p>
            </CardHeader>
            <CardContent>
              {filteredArchivedOrders.length > 0 ? (
                <div className="space-y-4">
                  {filteredArchivedOrders.map((order) => (
                    <OrderCard key={`archived-${order.id}`} order={order} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || dateFilter || roomFilter || idFilter ? 
                    'No se encontraron pedidos archivados que coincidan con los filtros' : 
                    'No hay pedidos archivados'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SearchOrders;
