import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Settings, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import HotelPermissionsManager from "./HotelPermissionsManager";

interface Hotel {
  id: string;
  hotel_name: string;
  agent_name: string;
  email: string;
  phone_roomservice: string;
  is_active: boolean;
  user_role: string;
  created_at: string;
  updated_at: string;
}

interface HotelsManagementProps {
  onStatsUpdate: () => void;
}

const HotelsManagement = ({ onStatsUpdate }: HotelsManagementProps) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_hotels');
      
      if (error) throw error;
      
      setHotels(data || []);
    } catch (error) {
      console.error('Error loading hotels:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los hoteles.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleHotelStatus = async (hotelId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hotel_user_settings')
        .update({ is_active: !currentStatus })
        .eq('id', hotelId);

      if (error) throw error;

      await loadHotels();
      onStatsUpdate();

      toast({
        title: "Éxito",
        description: `Hotel ${!currentStatus ? 'activado' : 'desactivado'} correctamente.`,
      });
    } catch (error) {
      console.error('Error updating hotel status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del hotel.",
        variant: "destructive"
      });
    }
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.hotel_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando hoteles...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Hoteles</CardTitle>
        <CardDescription>
          Administra todos los hoteles registrados en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar hoteles por nombre, agente o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHotels.map((hotel) => (
                <TableRow key={hotel.id}>
                  <TableCell className="font-medium">
                    {hotel.hotel_name || 'Sin nombre'}
                  </TableCell>
                  <TableCell>{hotel.agent_name || 'Sin agente'}</TableCell>
                  <TableCell>{hotel.email}</TableCell>
                  <TableCell>{hotel.phone_roomservice || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={hotel.is_active}
                        onCheckedChange={() => toggleHotelStatus(hotel.id, hotel.is_active)}
                      />
                      <Badge variant={hotel.is_active ? "default" : "secondary"}>
                        {hotel.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(hotel.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedHotel(hotel)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Permisos
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>
                              Permisos para {hotel.hotel_name}
                            </DialogTitle>
                            <DialogDescription>
                              Configura qué funcionalidades puede acceder este hotel
                            </DialogDescription>
                          </DialogHeader>
                          {selectedHotel && (
                            <HotelPermissionsManager selectedHotelId={selectedHotel.id} />
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredHotels.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron hoteles que coincidan con la búsqueda.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HotelsManagement;