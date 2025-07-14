import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, UtensilsCrossed, Calculator, Building2, BarChart3, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  feature_name: string;
  enabled: boolean;
}

interface Hotel {
  id: string;
  hotel_name: string;
}

interface HotelPermissionsManagerProps {
  selectedHotelId?: string;
}

const FEATURES = [
  { name: 'orders', label: 'Pedidos', icon: Package, description: 'Gestión de pedidos y orders' },
  { name: 'menu', label: 'Menú', icon: UtensilsCrossed, description: 'Gestión del menú y categorías' },
  { name: 'escandallos', label: 'Escandallos', icon: Calculator, description: 'Gestión de recetas y costos' },
  { name: 'proveedores', label: 'Proveedores', icon: Building2, description: 'Gestión de proveedores' },
  { name: 'cierres', label: 'Cierres', icon: BarChart3, description: 'Reportes y cierres de caja' }
];

const HotelPermissionsManager = ({ selectedHotelId }: HotelPermissionsManagerProps) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>(selectedHotelId || '');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedHotelId) {
      loadHotels();
    }
  }, [selectedHotelId]);

  useEffect(() => {
    if (selectedHotel) {
      loadPermissions(selectedHotel);
    }
  }, [selectedHotel]);

  useEffect(() => {
    if (selectedHotelId) {
      setSelectedHotel(selectedHotelId);
    }
  }, [selectedHotelId]);

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
    }
  };

  const loadPermissions = async (hotelId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_hotel_permissions', { target_hotel_id: hotelId });

      if (error) throw error;

      // Ensure all features are represented
      const permissionMap = new Map(data?.map(p => [p.feature_name, p.enabled]) || []);
      const allPermissions = FEATURES.map(feature => ({
        feature_name: feature.name,
        enabled: permissionMap.get(feature.name) ?? true
      }));

      setPermissions(allPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (featureName: string) => {
    setPermissions(prev => 
      prev.map(p => 
        p.feature_name === featureName 
          ? { ...p, enabled: !p.enabled }
          : p
      )
    );
  };

  const savePermissions = async () => {
    if (!selectedHotel) return;

    setSaving(true);
    try {
      // First, delete existing permissions for this hotel
      await supabase
        .from('hotel_permissions')
        .delete()
        .eq('hotel_id', selectedHotel);

      // Then insert the new permissions
      const permissionsToInsert = permissions.map(p => ({
        hotel_id: selectedHotel,
        feature_name: p.feature_name,
        enabled: p.enabled
      }));

      const { error } = await supabase
        .from('hotel_permissions')
        .insert(permissionsToInsert);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Permisos actualizados correctamente.",
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los permisos.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getFeatureIcon = (featureName: string) => {
    const feature = FEATURES.find(f => f.name === featureName);
    return feature?.icon || Package;
  };

  const getFeatureLabel = (featureName: string) => {
    const feature = FEATURES.find(f => f.name === featureName);
    return feature?.label || featureName;
  };

  const getFeatureDescription = (featureName: string) => {
    const feature = FEATURES.find(f => f.name === featureName);
    return feature?.description || '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permisos de Funcionalidades</CardTitle>
        <CardDescription>
          Configura qué funcionalidades puede acceder cada hotel
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedHotelId && (
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              Seleccionar Hotel
            </label>
            <Select value={selectedHotel} onValueChange={setSelectedHotel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un hotel..." />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.hotel_name || 'Sin nombre'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedHotel && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionalidad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Habilitado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => {
                    const Icon = getFeatureIcon(permission.feature_name);
                    return (
                      <TableRow key={permission.feature_name}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">
                              {getFeatureLabel(permission.feature_name)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {getFeatureDescription(permission.feature_name)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={permission.enabled ? "default" : "secondary"}>
                            {permission.enabled ? 'Habilitado' : 'Deshabilitado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={permission.enabled}
                            onCheckedChange={() => togglePermission(permission.feature_name)}
                            disabled={loading || saving}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                onClick={savePermissions} 
                disabled={saving || loading}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Permisos'}</span>
              </Button>
            </div>
          </>
        )}

        {!selectedHotel && !selectedHotelId && (
          <div className="text-center py-8 text-gray-500">
            Selecciona un hotel para gestionar sus permisos.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HotelPermissionsManager;