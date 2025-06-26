
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Package, DollarSign, Clock } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  preparation_time: number | null;
  ingredients: string | null;
  category_id: string | null;
}

interface MenuManagementProps {
  hotelId: string;
}

const MenuManagement = ({ hotelId }: MenuManagementProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    available: true,
    preparation_time: "",
    ingredients: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (hotelId) {
      loadMenuItems();
    }
  }, [hotelId]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      console.log('🍽️ Cargando menú para hotel:', hotelId);

      const { data: items, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('name');

      if (error) {
        throw error;
      }

      console.log('📋 Items del menú cargados:', items?.length || 0);
      setMenuItems(items || []);

    } catch (error) {
      console.error('Error cargando menú:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los items del menú",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!formData.name.trim() || !formData.price) {
      toast({
        title: "Error",
        description: "Nombre y precio son requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        available: formData.available,
        preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
        ingredients: formData.ingredients.trim() || null,
        hotel_id: hotelId
      };

      if (editingItem) {
        // Actualizar item existente
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id)
          .eq('hotel_id', hotelId);

        if (error) throw error;

        toast({
          title: "Item actualizado",
          description: "El item del menú ha sido actualizado exitosamente"
        });
      } else {
        // Crear nuevo item
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData]);

        if (error) throw error;

        toast({
          title: "Item agregado",
          description: "El nuevo item ha sido agregado al menú"
        });
      }

      // Recargar items y cerrar diálogo
      await loadMenuItems();
      handleCloseDialog();

    } catch (error) {
      console.error('Error guardando item:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el item del menú",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este item del menú?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId)
        .eq('hotel_id', hotelId);

      if (error) throw error;

      toast({
        title: "Item eliminado",
        description: "El item ha sido eliminado del menú"
      });

      await loadMenuItems();

    } catch (error) {
      console.error('Error eliminando item:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el item del menú",
        variant: "destructive"
      });
    }
  };

  const handleToggleAvailability = async (itemId: string, available: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !available })
        .eq('id', itemId)
        .eq('hotel_id', hotelId);

      if (error) throw error;

      await loadMenuItems();
      
      toast({
        title: "Disponibilidad actualizada",
        description: `El item ha sido ${!available ? 'activado' : 'desactivado'}`
      });

    } catch (error) {
      console.error('Error actualizando disponibilidad:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la disponibilidad",
        variant: "destructive"
      });
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      available: item.available,
      preparation_time: item.preparation_time?.toString() || "",
      ingredients: item.ingredients || ""
    });
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      available: true,
      preparation_time: "",
      ingredients: ""
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Menú</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Card key={item.id} className={`${!item.available ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="flex gap-2">
                  <Switch
                    checked={item.available}
                    onCheckedChange={() => handleToggleAvailability(item.id, item.available)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditItem(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-bold text-green-600">€{item.price.toFixed(2)}</span>
              </div>

              {item.preparation_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{item.preparation_time} min</span>
                </div>
              )}

              {item.ingredients && (
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span className="text-sm text-gray-600">{item.ingredients}</span>
                </div>
              )}

              <Badge variant={item.available ? "default" : "secondary"}>
                {item.available ? "Disponible" : "No disponible"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay items en el menú</h3>
          <p className="text-gray-500 mb-4">Comienza agregando items a tu menú</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primer Item
          </Button>
        </div>
      )}

      {/* Diálogo para agregar/editar item */}
      <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Agregar Nuevo Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Nombre del plato"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción del plato"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparation_time">Tiempo de preparación (minutos)</Label>
              <Input
                id="preparation_time"
                type="number"
                placeholder="15"
                value={formData.preparation_time}
                onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredientes</Label>
              <Textarea
                id="ingredients"
                placeholder="Lista de ingredientes"
                value={formData.ingredients}
                onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
              />
              <Label htmlFor="available">Disponible</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleCloseDialog} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveItem} className="flex-1">
                {editingItem ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;
