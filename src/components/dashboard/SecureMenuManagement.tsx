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
import { createSecureWebhookPayload } from "@/utils/inputValidation";
import SecureInputValidation from "./orders/SecureInputValidation";
import { validateUserHotelAccess, logSecurityEvent, validateFileUpload } from "./orders/securityUtils";

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

interface SecureMenuManagementProps {
  hotelId: string;
}

const SecureMenuManagement = ({ hotelId }: SecureMenuManagementProps) => {
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
      initializeSecureMenu();
    }
  }, [hotelId]);

  const initializeSecureMenu = async () => {
    const hasAccess = await validateUserHotelAccess(hotelId);
    if (!hasAccess) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para gestionar este menú",
        variant: "destructive"
      });
      return;
    }

    await logSecurityEvent('menu_management_accessed', 'menu', hotelId);
    await loadMenuItems();
    await loadCategories();
  };

  const loadMenuItems = async () => {
    try {
      // Las RLS policies se encargan del filtrado automático
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
      await logSecurityEvent('menu_items_loaded', 'menu_items', hotelId, { count: data?.length || 0 });
    } catch (error) {
      console.error('Error loading menu items:', error);
      await logSecurityEvent('menu_items_load_error', 'menu_items', hotelId, { error: String(error) });
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
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      await logSecurityEvent('menu_categories_load_error', 'menu_categories', hotelId, { error: String(error) });
    }
  };

  const handleAvailabilityToggle = async (itemId: string, currentAvailability: boolean) => {
    try {
      const hasAccess = await validateUserHotelAccess(hotelId);
      if (!hasAccess) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para esta acción",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('menu_items')
        .update({ available: !currentAvailability })
        .eq('id', itemId);

      if (error) throw error;
      
      await logSecurityEvent('menu_item_availability_changed', 'menu_items', itemId, {
        newAvailability: !currentAvailability
      });
      
      toast({
        title: "Éxito",
        description: `Elemento ${!currentAvailability ? 'activado' : 'desactivado'} correctamente`
      });
      await loadMenuItems();
    } catch (error) {
      console.error('Error updating availability:', error);
      await logSecurityEvent('menu_item_availability_error', 'menu_items', itemId, { error: String(error) });
      toast({
        title: "Error",
        description: "No se pudo actualizar la disponibilidad",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;

    try {
      const hasAccess = await validateUserHotelAccess(hotelId);
      if (!hasAccess) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para esta acción",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await logSecurityEvent('menu_item_deleted', 'menu_items', id);
      
      toast({
        title: "Éxito",
        description: "Elemento eliminado correctamente"
      });
      await loadMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      await logSecurityEvent('menu_item_delete_error', 'menu_items', id, { error: String(error) });
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

    // Validar archivo
    const fileValidation = validateFileUpload(selectedFile);
    if (!fileValidation.valid) {
      toast({
        title: "Error",
        description: fileValidation.error,
        variant: "destructive"
      });
      return;
    }

    const hasAccess = await validateUserHotelAccess(hotelId);
    if (!hasAccess) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para esta acción",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      await logSecurityEvent('menu_import_initiated', 'menu_import', hotelId, {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });

      const securePayload = createSecureWebhookPayload(selectedFile, hotelId);
      
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

      await logSecurityEvent('menu_import_completed', 'menu_import', hotelId);
      
      toast({
        title: "Éxito",
        description: "Archivo procesado correctamente"
      });
      setShowImportDialog(false);
      setSelectedFile(null);
      setTimeout(() => loadMenuItems(), 2000);
      
    } catch (error: any) {
      console.error('Error uploading file:', error);
      await logSecurityEvent('menu_import_error', 'menu_import', hotelId, { error: String(error) });
      
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando menú de forma segura...</p>
        </div>
      </div>
    );
  }

  return (
    <SecureInputValidation>
      {(validationUtils) => (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Gestión Segura del Menú</h1>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Tiempo (min)</TableHead>
                    <TableHead>Alérgenos</TableHead>
                    <TableHead>Disponible</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
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
                        <Switch
                          checked={item.available}
                          onCheckedChange={() => handleAvailabilityToggle(item.id, item.available)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
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
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {menuItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No hay elementos en el menú
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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

              <form onSubmit={async (e) => {
                e.preventDefault();

                const { 
                  validateAndSanitizeText, 
                  validateAmount,
                } = validationUtils;

                // Await the async validation functions
                const nameValidation = await validateAndSanitizeText(formData.name, 100);
                if (!nameValidation.isValid) {
                  toast({
                    title: "Error",
                    description: `Nombre inválido: ${nameValidation.error}`,
                    variant: "destructive"
                  });
                  return;
                }

                const descriptionValidation = await validateAndSanitizeText(formData.description, 500);

                const priceValidation = await validateAmount(parseFloat(formData.price));
                if (!priceValidation.isValid) {
                  toast({
                    title: "Error",
                    description: `Precio inválido: ${priceValidation.error}`,
                    variant: "destructive"
                  });
                  return;
                }

                try {
                  const allergensList = formData.allergens
                    .split(',')
                    .map(allergen => allergen.trim())
                    .filter(allergen => allergen.length > 0);

                  const menuItemData = {
                    name: nameValidation.sanitizedValue!,
                    description: descriptionValidation.sanitizedValue,
                    price: parseFloat(priceValidation.sanitizedValue!),
                    category_id: formData.category_id || null,
                    preparation_time: parseInt(formData.preparation_time) || 0,
                    ingredients: formData.ingredients,
                    allergens: allergensList,
                    hotel_id: hotelId,
                    available: true
                  };

                  if (editingItem) {
                    const { error } = await supabase
                      .from('menu_items')
                      .update(menuItemData)
                      .eq('id', editingItem.id);

                    if (error) throw error;
                    toast({
                      title: "Éxito",
                      description: "Elemento actualizado correctamente"
                    });
                    await logSecurityEvent('menu_item_updated', 'menu_items', editingItem.id);
                  } else {
                    const { error } = await supabase
                      .from('menu_items')
                      .insert([menuItemData]);

                    if (error) throw error;
                    toast({
                      title: "Éxito",
                      description: "Elemento creado correctamente"
                    });
                    await logSecurityEvent('menu_item_created', 'menu_items', nameValidation.sanitizedValue!);
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
                  await logSecurityEvent('menu_item_save_error', 'menu_items', nameValidation.sanitizedValue!, { error: String(error) });
                  toast({
                    title: "Error",
                    description: "No se pudo guardar el elemento",
                    variant: "destructive"
                  });
                }
              }} className="space-y-4">
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
          <Dialog open={showImportDialog} onOpenChange={() => {
            setShowImportDialog(false);
            setSelectedFile(null);
          }}>
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
                  <Button variant="outline" onClick={() => {
                    setShowImportDialog(false);
                    setSelectedFile(null);
                  }}>
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
      )}
    </SecureInputValidation>
  );
};

export default SecureMenuManagement;
