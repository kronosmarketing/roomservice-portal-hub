import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { createSecureWebhookPayload, sanitizeInput } from "@/utils/inputValidation";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  available: boolean;
  preparation_time: number;
  ingredients: string;
}

interface MenuManagementProps {
  hotelId: string;
}

const MenuManagement = ({ hotelId }: MenuManagementProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    preparation_time: "",
    ingredients: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (hotelId) {
      loadMenuItems();
      loadCategories();
    }
  }, [hotelId]);

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los elementos del menú",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        name: sanitizeInput(formData.name),
        description: sanitizeInput(formData.description),
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        preparation_time: parseInt(formData.preparation_time) || 0,
        ingredients: sanitizeInput(formData.ingredients),
        hotel_id: hotelId,
        available: true
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id)
          .eq('hotel_id', hotelId);

        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Elemento actualizado correctamente"
        });
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData]);

        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Elemento creado correctamente"
        });
      }

      setShowDialog(false);
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category_id: "",
        preparation_time: "",
        ingredients: ""
      });
      await loadMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el elemento",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category_id: item.category_id || "",
      preparation_time: item.preparation_time?.toString() || "",
      ingredients: item.ingredients || ""
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
        .eq('hotel_id', hotelId);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Elemento eliminado correctamente"
      });
      await loadMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el elemento",
        variant: "destructive"
      });
    }
  };

  const handleImportMenu = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Create secure payload with validation
      const securePayload = createSecureWebhookPayload(selectedFile, hotelId);
      
      // Use our secure edge function instead of direct webhook call
      const response = await supabase.functions.invoke('import-menu', {
        body: securePayload,
        headers: {
          'X-Hotel-ID': hotelId,
          'X-Timestamp': new Date().toISOString()
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error desconocido del servidor');
      }

      toast({
        title: "Éxito",
        description: "Archivo enviado correctamente para procesamiento"
      });
      setShowImportDialog(false);
      setSelectedFile(null);
      // Reload menu after processing
      setTimeout(() => loadMenuItems(), 2000);
      
    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      let errorMessage = "No se pudo procesar el archivo";
      if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        errorMessage = "Error de conexión. Verifica tu conexión a internet";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
    setSelectedFile(null);
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
        <h1 className="text-2xl font-bold text-white">Gestión del Menú</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowImportDialog(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar Menú
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Elemento
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <Badge variant={item.available ? "default" : "secondary"}>
                  {item.available ? "Disponible" : "No disponible"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-green-600">€{item.price}</span>
                {item.preparation_time && (
                  <span className="text-sm text-gray-500">{item.preparation_time} min</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Elemento" : "Agregar Nuevo Elemento"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prep-time">Tiempo (min)</Label>
                <Input
                  id="prep-time"
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredientes</Label>
              <Textarea
                id="ingredients"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingItem ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={handleCloseImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Menú</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Archivo del Menú *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.json,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-gray-500">
                Formatos permitidos: PDF, Excel, CSV, JSON, TXT (máx. 10MB)
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseImportDialog}>
                Cancelar
              </Button>
              <Button 
                onClick={handleImportMenu} 
                className="flex-1"
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? "Enviando..." : "Importar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;
