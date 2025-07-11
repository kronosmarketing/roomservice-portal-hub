
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calculator, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Escandallo {
  id: string;
  name: string;
  portions: number;
  total_cost: number;
  selling_price: number;
  profit_margin: number;
  notes: string;
  menu_item_id: string;
  created_at: string;
  ingredients: RecipeIngredient[];
}

interface RecipeIngredient {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
}

interface EscandallosManagementProps {
  hotelId: string;
}

const EscandallosManagement = ({ hotelId }: EscandallosManagementProps) => {
  const [escandallos, setEscandallos] = useState<Escandallo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEscandallo, setEditingEscandallo] = useState<Escandallo | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    portions: 1,
    notes: "",
    menu_item_id: "",
    ingredients: [] as RecipeIngredient[]
  });

  useEffect(() => {
    if (hotelId) {
      loadEscandallos();
      loadMenuItems();
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
            total_cost
          )
        `)
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedData = data?.map(item => ({
        ...item,
        ingredients: item.recipe_ingredients || []
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalCost = formData.ingredients.reduce((sum, ing) => sum + ing.total_cost, 0);
      const selectedMenuItem = menuItems.find(item => item.id === formData.menu_item_id);
      const sellingPrice = selectedMenuItem?.price || 0;
      const profitMargin = sellingPrice > 0 ? ((sellingPrice - totalCost) / sellingPrice) * 100 : 0;

      const escandalloData = {
        name: formData.name,
        portions: formData.portions,
        notes: formData.notes,
        menu_item_id: formData.menu_item_id || null,
        hotel_id: hotelId,
        total_cost: totalCost,
        selling_price: sellingPrice,
        profit_margin: profitMargin
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
          total_cost: ing.total_cost
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsData);

        if (ingredientsError) throw ingredientsError;
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
      ingredients: []
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
      ingredients: escandallo.ingredients || []
    });
    setDialogOpen(true);
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

  const addIngredient = () => {
    const newIngredient: RecipeIngredient = {
      id: `temp-${Date.now()}`,
      ingredient_name: "",
      quantity: 0,
      unit: "g",
      unit_cost: 0,
      total_cost: 0
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEscandallo ? 'Editar Escandallo' : 'Nuevo Escandallo'}
              </DialogTitle>
              <DialogDescription>
                Crea o edita un escandallo para analizar costos y rentabilidad
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ingredientes</Label>
                  <Button type="button" onClick={addIngredient} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Ingrediente
                  </Button>
                </div>
                
                {formData.ingredients.map((ingredient, index) => (
                  <div key={ingredient.id} className="grid grid-cols-5 gap-2 items-end">
                    <div>
                      <Label>Ingrediente</Label>
                      <Input
                        value={ingredient.ingredient_name}
                        onChange={(e) => updateIngredient(index, 'ingredient_name', e.target.value)}
                        placeholder="Nombre del ingrediente"
                      />
                    </div>
                    <div>
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Unidad</Label>
                      <Select value={ingredient.unit} onValueChange={(value) => updateIngredient(index, 'unit', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">Gramos</SelectItem>
                          <SelectItem value="kg">Kilogramos</SelectItem>
                          <SelectItem value="ml">Mililitros</SelectItem>
                          <SelectItem value="l">Litros</SelectItem>
                          <SelectItem value="ud">Unidades</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Precio/Unidad (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={ingredient.unit_cost}
                        onChange={(e) => updateIngredient(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">
                        €{ingredient.total_cost.toFixed(2)}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeIngredient(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {formData.ingredients.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Costo Total:</span>
                    <span className="text-lg font-bold">
                      €{formData.ingredients.reduce((sum, ing) => sum + ing.total_cost, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
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

      <div className="grid gap-4">
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
          <Card>
            <CardHeader>
              <CardTitle>Lista de Escandallos</CardTitle>
              <CardDescription>
                Gestiona tus análisis de costos y rentabilidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Porciones</TableHead>
                    <TableHead>Costo Total</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead>Margen (%)</TableHead>
                    <TableHead>Ingredientes</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escandallos.map((escandallo) => (
                    <TableRow key={escandallo.id}>
                      <TableCell className="font-medium">{escandallo.name}</TableCell>
                      <TableCell>{escandallo.portions}</TableCell>
                      <TableCell>€{escandallo.total_cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>€{escandallo.selling_price?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Badge variant={escandallo.profit_margin > 20 ? "default" : "destructive"}>
                          {escandallo.profit_margin?.toFixed(1) || '0.0'}%
                        </Badge>
                      </TableCell>
                      <TableCell>{escandallo.ingredients?.length || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(escandallo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(escandallo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EscandallosManagement;
