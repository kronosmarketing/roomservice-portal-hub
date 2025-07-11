import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calculator, Eye, Send, Package, ChefHat } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import ImageUpload from "./ImageUpload";
import RecipeDetailView from "./RecipeDetailView";
import RecipeStepsManager from "./RecipeStepsManager";
import SupplierIngredientForm from "./SupplierIngredientForm";
import PublishToMenuDialog from "./PublishToMenuDialog";

interface RecipeStep {
  id: string;
  step_number: number;
  description: string;
  time_minutes?: number;
  temperature?: number;
}

interface Escandallo {
  id: string;
  name: string;
  portions: number;
  total_cost: number;
  selling_price: number;
  profit_margin: number;
  notes: string;
  menu_item_id: string;
  image_url?: string;
  allergens?: string[];
  created_at: string;
  ingredients: RecipeIngredient[];
  recipe_steps?: RecipeStep[];
}

interface RecipeIngredient {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  supplier_product_id?: string;
}

interface SupplierProduct {
  id: string;
  name: string;
  price: number;
  package_size: number;
  unit: string;
  reference?: string;
  supplier: {
    name: string;
  };
}

interface EscandallosManagementProps {
  hotelId: string;
}

const ALLERGENS_OPTIONS = [
  'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuetes', 'Soja',
  'Lácteos', 'Frutos secos', 'Apio', 'Mostaza', 'Sésamo', 'Sulfitos',
  'Altramuces', 'Moluscos'
];

const EscandallosManagement = ({ hotelId }: EscandallosManagementProps) => {
  const [escandallos, setEscandallos] = useState<Escandallo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Escandallo | null>(null);
  const [editingEscandallo, setEditingEscandallo] = useState<Escandallo | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    portions: 1,
    notes: "",
    menu_item_id: "",
    image_url: "",
    allergens: [] as string[],
    customAllergens: "",
    ingredients: [] as RecipeIngredient[],
    recipe_steps: [] as RecipeStep[]
  });

  useEffect(() => {
    if (hotelId) {
      loadEscandallos();
      loadMenuItems();
      loadSupplierProducts();
    }
  }, [hotelId]);

  const loadEscandallos = async () => {
    try {
      const { data, error } = await supabase
        .from('recipe_scandallos')
        .select(`
          *,
          recipe_ingredients (
            id,
            ingredient_name,
            quantity,
            unit,
            unit_cost,
            total_cost,
            supplier_product_id
          ),
          recipe_steps (
            id,
            step_number,
            description,
            time_minutes,
            temperature
          )
        `)
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedData = data?.map(item => ({
        ...item,
        ingredients: item.recipe_ingredients || [],
        recipe_steps: item.recipe_steps || []
      })) || [];

      setEscandallos(processedData);
    } catch (error) {
      console.error('Error loading escandallos:', error);
      toast({
        title: "Error",
        description: "Error al cargar los escandallos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, price')
        .eq('hotel_id', hotelId)
        .eq('available', true);

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  };

  const loadSupplierProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          id,
          name,
          price,
          package_size,
          unit,
          reference,
          suppliers!inner (
            name,
            hotel_id
          )
        `)
        .eq('suppliers.hotel_id', hotelId);

      if (error) throw error;
      
      const processedProducts = data?.map(product => ({
        ...product,
        supplier: { name: product.suppliers.name }
      })) || [];
      
      setSupplierProducts(processedProducts);
    } catch (error) {
      console.error('Error loading supplier products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalCost = formData.ingredients.reduce((sum, ing) => sum + ing.total_cost, 0);
      const selectedMenuItem = menuItems.find(item => item.id === formData.menu_item_id);
      const sellingPrice = selectedMenuItem?.price || 0;
      const profitMargin = sellingPrice > 0 ? ((sellingPrice - totalCost) / sellingPrice) * 100 : 0;

      // Combine predefined and custom allergens
      const allAllergens = [...formData.allergens];
      if (formData.customAllergens.trim()) {
        const customList = formData.customAllergens.split(',').map(a => a.trim()).filter(a => a);
        allAllergens.push(...customList);
      }

      const escandalloData = {
        name: formData.name,
        portions: formData.portions,
        notes: formData.notes,
        menu_item_id: formData.menu_item_id || null,
        hotel_id: hotelId,
        total_cost: totalCost,
        selling_price: sellingPrice,
        profit_margin: profitMargin,
        image_url: formData.image_url || null,
        allergens: allAllergens.length > 0 ? allAllergens : null
      };

      let escandalloId;

      if (editingEscandallo) {
        const { error } = await supabase
          .from('recipe_scandallos')
          .update(escandalloData)
          .eq('id', editingEscandallo.id);

        if (error) throw error;
        escandalloId = editingEscandallo.id;
      } else {
        const { data, error } = await supabase
          .from('recipe_scandallos')
          .insert(escandalloData)
          .select()
          .single();

        if (error) throw error;
        escandalloId = data.id;
      }

      // Update ingredients
      if (editingEscandallo) {
        await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', escandalloId);
      }

      if (formData.ingredients.length > 0) {
        const ingredientsData = formData.ingredients.map(ing => ({
          recipe_id: escandalloId,
          ingredient_name: ing.ingredient_name,
          quantity: ing.quantity,
          unit: ing.unit,
          unit_cost: ing.unit_cost,
          total_cost: ing.total_cost,
          supplier_product_id: ing.supplier_product_id || null
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsData);

        if (ingredientsError) throw ingredientsError;
      }

      // Update recipe steps
      if (editingEscandallo) {
        await supabase
          .from('recipe_steps')
          .delete()
          .eq('recipe_id', escandalloId);
      }

      if (formData.recipe_steps.length > 0) {
        const stepsData = formData.recipe_steps.map(step => ({
          recipe_id: escandalloId,
          step_number: step.step_number,
          description: step.description,
          time_minutes: step.time_minutes || null,
          temperature: step.temperature || null
        }));

        const { error: stepsError } = await supabase
          .from('recipe_steps')
          .insert(stepsData);

        if (stepsError) throw stepsError;
      }

      // Update ingredient-supplier mapping if needed
      for (const ingredient of formData.ingredients) {
        if (ingredient.supplier_product_id) {
          await supabase
            .from('ingredient_supplier_mapping')
            .upsert({
              hotel_id: hotelId,
              ingredient_name: ingredient.ingredient_name,
              supplier_product_id: ingredient.supplier_product_id,
              conversion_factor: 1
            });
        }
      }

      toast({
        title: "Éxito",
        description: `Escandallo ${editingEscandallo ? 'actualizado' : 'creado'} correctamente`,
      });

      setDialogOpen(false);
      resetForm();
      loadEscandallos();
    } catch (error) {
      console.error('Error saving escandallo:', error);
      toast({
        title: "Error",
        description: "Error al guardar el escandallo",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      portions: 1,
      notes: "",
      menu_item_id: "",
      image_url: "",
      allergens: [],
      customAllergens: "",
      ingredients: [],
      recipe_steps: []
    });
    setEditingEscandallo(null);
  };

  const handleEdit = (escandallo: Escandallo) => {
    setEditingEscandallo(escandallo);
    setFormData({
      name: escandallo.name,
      portions: escandallo.portions,
      notes: escandallo.notes || "",
      menu_item_id: escandallo.menu_item_id || "",
      image_url: escandallo.image_url || "",
      allergens: escandallo.allergens || [],
      customAllergens: "",
      ingredients: escandallo.ingredients || [],
      recipe_steps: escandallo.recipe_steps || []
    });
    setDialogOpen(true);
  };

  const handleView = (escandallo: Escandallo) => {
    setSelectedRecipe(escandallo);
    setDetailViewOpen(true);
  };

  const handlePublish = (escandallo: Escandallo) => {
    setSelectedRecipe(escandallo);
    setPublishDialogOpen(true);
  };

  const handleSend = async (escandalloId: string) => {
    try {
      setSending(escandalloId);
      
      const { data, error } = await supabase.functions.invoke('send-recipe', {
        body: { 
          recipeId: escandalloId,
          hotelId: hotelId 
        }
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Escandallo enviado correctamente",
      });
    } catch (error) {
      console.error('Error sending recipe:', error);
      toast({
        title: "Error",
        description: "Error al enviar el escandallo",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este escandallo?')) return;

    try {
      const { error } = await supabase
        .from('recipe_scandallos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Escandallo eliminado correctamente",
      });

      loadEscandallos();
    } catch (error) {
      console.error('Error deleting escandallo:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el escandallo",
        variant: "destructive",
      });
    }
  };

  const addIngredient = (type: 'manual' | 'supplier' = 'manual') => {
    const newIngredient: RecipeIngredient = {
      id: `temp-${Date.now()}`,
      ingredient_name: "",
      quantity: 0,
      unit: "g",
      unit_cost: 0,
      total_cost: 0,
      supplier_product_id: type === 'supplier' ? null : undefined
    };
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_cost') {
      updatedIngredients[index].total_cost = 
        updatedIngredients[index].quantity * updatedIngredients[index].unit_cost;
    }
    
    setFormData(prev => ({ ...prev, ingredients: updatedIngredients }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const toggleAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando escandallos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Escandallos</h2>
          <p className="text-gray-600">Análisis de costos y rentabilidad de recetas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Escandallo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEscandallo ? 'Editar Escandallo' : 'Nuevo Escandallo'}
              </DialogTitle>
              <DialogDescription>
                Crea o edita un escandallo para analizar costos y rentabilidad
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información General</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre del Escandallo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="portions">Porciones</Label>
                    <Input
                      id="portions"
                      type="number"
                      min="1"
                      value={formData.portions}
                      onChange={(e) => setFormData(prev => ({ ...prev, portions: parseInt(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="menu_item">Plato del Menú (Opcional)</Label>
                  <Select value={formData.menu_item_id} onValueChange={(value) => setFormData(prev => ({ ...prev, menu_item_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plato" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - €{item.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas adicionales sobre la receta..."
                  />
                </div>

                <ImageUpload
                  currentImageUrl={formData.image_url}
                  onImageUploaded={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  onImageRemoved={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                />
              </div>

              <Separator />

              {/* Ingredients Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Ingredientes</h3>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => addIngredient('manual')} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Manual
                    </Button>
                    <Button type="button" onClick={() => addIngredient('supplier')} size="sm">
                      <Package className="h-4 w-4 mr-2" />
                      Desde Proveedor
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {formData.ingredients.map((ingredient, index) => (
                    <SupplierIngredientForm
                      key={ingredient.id}
                      ingredient={ingredient}
                      index={index}
                      supplierProducts={supplierProducts}
                      onUpdate={updateIngredient}
                      onRemove={removeIngredient}
                    />
                  ))}
                </div>

                {formData.ingredients.length > 0 && (
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Costo Total:</span>
                        <span className="text-lg font-bold">
                          €{formData.ingredients.reduce((sum, ing) => sum + ing.total_cost, 0).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator />

              {/* Recipe Steps Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pasos de Preparación</h3>
                <RecipeStepsManager
                  steps={formData.recipe_steps}
                  onStepsChange={(steps) => setFormData(prev => ({ ...prev, recipe_steps: steps }))}
                />
              </div>

              <Separator />

              {/* Allergens Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Alérgenos</h3>
                
                <div>
                  <Label>Alérgenos Predefinidos</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {ALLERGENS_OPTIONS.map((allergen) => (
                      <div key={allergen} className="flex items-center space-x-2">
                        <Checkbox
                          id={allergen}
                          checked={formData.allergens.includes(allergen)}
                          onCheckedChange={() => toggleAllergen(allergen)}
                        />
                        <Label
                          htmlFor={allergen}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {allergen}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="customAllergens">Alérgenos Personalizados</Label>
                  <Input
                    id="customAllergens"
                    value={formData.customAllergens}
                    onChange={(e) => setFormData(prev => ({ ...prev, customAllergens: e.target.value }))}
                    placeholder="Ej: Miel, Quinoa, Coco (separados por comas)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separar múltiples alérgenos con comas
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEscandallo ? 'Actualizar' : 'Crear'} Escandallo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {escandallos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay escandallos creados</h3>
              <p className="text-gray-600 mb-4">
                Crea tu primer escandallo para analizar costos y rentabilidad
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Lista de Escandallos</CardTitle>
              <CardDescription>
                Gestiona tus análisis de costos y rentabilidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Imagen</TableHead>
                      <TableHead className="min-w-[200px]">Nombre</TableHead>
                      <TableHead className="w-24">Porciones</TableHead>
                      <TableHead className="w-28">Costo Total</TableHead>
                      <TableHead className="w-28">Precio Venta</TableHead>
                      <TableHead className="w-24">Margen (%)</TableHead>
                      <TableHead className="w-24">Ingredientes</TableHead>
                      <TableHead className="w-20">Pasos</TableHead>
                      <TableHead className="w-48">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escandallos.map((escandallo) => (
                      <TableRow key={escandallo.id} className="hover:bg-gray-50">
                        <TableCell>
                          {escandallo.image_url ? (
                            <img 
                              src={escandallo.image_url} 
                              alt={escandallo.name}
                              className="w-12 h-12 object-cover rounded-lg shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Calculator className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{escandallo.name}</div>
                            {escandallo.allergens && escandallo.allergens.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {escandallo.allergens.slice(0, 2).map((allergen, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-red-50 border-red-200">
                                    {allergen}
                                  </Badge>
                                ))}
                                {escandallo.allergens.length > 2 && (
                                  <Badge variant="outline" className="text-xs bg-red-50 border-red-200">
                                    +{escandallo.allergens.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{escandallo.portions}</TableCell>
                        <TableCell className="font-mono">€{escandallo.total_cost?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell className="font-mono">€{escandallo.selling_price?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Badge variant={escandallo.profit_margin > 20 ? "default" : "destructive"}>
                            {escandallo.profit_margin?.toFixed(1) || '0.0'}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{escandallo.ingredients?.length || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{escandallo.recipe_steps?.length || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(escandallo)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(escandallo)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublish(escandallo)}
                              title="Publicar en Menú"
                              className="text-green-600 hover:text-green-800"
                            >
                              <ChefHat className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSend(escandallo.id)}
                              disabled={sending === escandallo.id}
                              title="Enviar"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(escandallo.id)}
                              title="Eliminar"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail View Dialog */}
      {selectedRecipe && (
        <RecipeDetailView
          open={detailViewOpen}
          onOpenChange={setDetailViewOpen}
          recipe={selectedRecipe}
        />
      )}

      {/* Publish to Menu Dialog */}
      {selectedRecipe && (
        <PublishToMenuDialog
          open={publishDialogOpen}
          onOpenChange={setPublishDialogOpen}
          escandallo={selectedRecipe}
          hotelId={hotelId}
          onPublished={() => {
            loadEscandallos();
            loadMenuItems();
          }}
        />
      )}
    </div>
  );
};

export default EscandallosManagement;
