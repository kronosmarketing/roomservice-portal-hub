import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Mail, Phone, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SystemUser {
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

interface SystemUsersManagerProps {
  onStatsUpdate: () => void;
}

const SystemUsersManager = ({ onStatsUpdate }: SystemUsersManagerProps) => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_hotels');
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hotel_user_settings')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      onStatsUpdate();

      toast({
        title: "Éxito",
        description: `Usuario ${!currentStatus ? 'activado' : 'desactivado'} correctamente.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario.",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.hotel_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'hotel_admin':
        return 'default';
      case 'hotel_manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'hotel_admin':
        return 'Admin Hotel';
      case 'hotel_manager':
        return 'Manager Hotel';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando usuarios...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Usuarios del Sistema</CardTitle>
        <CardDescription>
          Administra todos los usuarios registrados en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar usuarios por nombre, hotel o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Hotel</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Último Acceso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {user.agent_name || 'Sin nombre'}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.hotel_name || 'Sin nombre'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.phone_roomservice && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {user.phone_roomservice}
                        </div>
                      )}
                      {!user.phone_roomservice && (
                        <span className="text-gray-400 text-sm">Sin teléfono</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.user_role)}>
                      {getRoleLabel(user.user_role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => toggleUserStatus(user.id, user.is_active)}
                      />
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(user.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(user.updated_at)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron usuarios que coincidan con la búsqueda.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemUsersManager;