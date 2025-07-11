import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { createSecureWebhookPayload, sanitizeInput } from "@/utils/inputValidation";
import { UtensilsCrossed } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  available: boolean;
  preparation_time: number;
  ingredients: string;
  allergens: string[];
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
    ingredients: "",
    allergens: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (hotelId) {
      initializeMenuManagement();
    }
  }, [hotelId]);

  const initializeMenuManagement = async () => {
    try {
      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error de autenticación:', authError);
        setLoading(false);
        return;
      }

      console.log('Usuario autenticado:', user.email);

      await loadMenuItems();
      await loadCategories();
    } catch (error) {
      console.error('Error inicializando gestión de menú:', error);
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      // Usar RLS - automáticamente filtra por hotel del usuario autenticado
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading menu items:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los elementos del menú",
          variant: "destructive"
        });
        setMenuItems([]);
      } else {
        console.log('📋 Items del menú encontrados:', data?.length || 0);
        setMenuItems(data || []);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Usar RLS - automáticamente filtra por hotel del usuario autenticado
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const handleAvailabilityToggle = async (itemId: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !currentAvailability })
        .eq('id', itemId);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: `Elemento ${!currentAvailability ? 'activado' : 'desactivado'} correctamente`
      });
      await loadMenuItems();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la disponibilidad",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const allergensList = formData.allergens
        .split(',')
        .map(allergen => allergen.trim())
        .filter(allergen => allergen.length > 0);

      const itemData = {
        name: sanitizeInput(formData.name),
        description: sanitizeInput(formData.description),
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        preparation_time: parseInt(formData.preparation_time) || 0,
        ingredients: sanitizeInput(formData.ingredients),
        allergens: allergensList,
        hotel_id: hotelId, // RLS se encargará de validar que coincida con el usuario
        available: true
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

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
        ingredients: "",
        allergens: ""
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
      ingredients: item.ingredients || "",
      allergens: item.allergens?.join(', ') || ""
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

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
      console.log('🚀 Iniciando importación de menú...');
      console.log('📁 Archivo:', selectedFile.name, 'Tamaño:', selectedFile.size);
      console.log('🏨 Hotel ID:', hotelId);

      // Crear FormData con el archivo
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await supabase.functions.invoke('import-menu', {
        body: formData,
        headers: {
          'X-Hotel-ID': hotelId,
          'X-Timestamp': new Date().toISOString()
        }
      });

      console.log('📡 Respuesta del servidor:', response);

      if (response.error) {
        console.error('❌ Error en la función edge:', response.error);
        throw new Error(response.error.message || 'Error desconocido del servidor');
      }

      console.log('✅ Importación exitosa');
      
      toast({
        title: "Éxito",
        description: "Archivo enviado correctamente para procesamiento"
      });
      setShowImportDialog(false);
      setSelectedFile(null);
      
      // Recargar elementos del menú después de un breve delay
      setTimeout(() => {
        loadMenuItems();
      }, 2000);
      
    } catch (error: any) {
      console.error('💥 Error uploading file:', error);
      
      let errorMessage = "No se pudo procesar el archivo";
      if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        errorMessage = "Error de conexión. Verifica tu conexión a internet";
      } else if (error.message?.includes('timeout')) {
        errorMessage = "El servicio está tardando demasiado en responder";
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
        <h1 className="text-2xl font-bold text-gray-800">Gestión del Menú</h1>
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

      <Card>
        <CardContent className="p-0">
          {menuItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg">No hay elementos en el menú</p>
                <p className="text-sm">Agrega tu primer elemento para empezar</p>
              </div>
              <Button onClick={() => setShowDialog(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Elemento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Tiempo (min)</TableHead>
                  <TableHead>Alérgenos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={item.available}
                        onCheckedChange={() => handleAvailabilityToggle(item.id, item.available)}
                      />
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                    <TableCell className="text-green-600 font-bold">€{item.price}</TableCell>
                    <TableCell>{item.preparation_time || '-'}</TableCell>
                    <TableCell className="max-w-xs">
                      {item.allergens && item.allergens.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.allergens.map((allergen, index) => (
                            <span
                              key={index}
                              className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full"
                            >
                              {allergen}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin alérgenos</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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

            <div className="space-y-2">
              <Label htmlFor="allergens">Alérgenos</Label>
              <Input
                id="allergens"
                value={formData.allergens}
                onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                placeholder="Separar por comas (ej: gluten, lácteos, frutos secos)"
              />
              <p className="text-sm text-gray-500">
                Separar múltiples alérgenos con comas
              </p>
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
