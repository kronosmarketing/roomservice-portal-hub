
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Send, DollarSign } from "lucide-react";

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
  ingredients: any[];
}

interface PublishToMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escandallo: Escandallo;
  hotelId: string;
  onPublished: () => void;
}

const PublishToMenuDialog = ({ open, onOpenChange, escandallo, hotelId, onPublished }: PublishToMenuDialogProps) => {
  const [publishing, setPublishing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: escandallo.name,
    description: `Delicioso plato preparado con ${escandallo.ingredients.length} ingredientes seleccionados. ${escandallo.notes || ''}`.trim(),
    price: escandallo.selling_price || escandallo.total_cost * 2.5, // Default margin if no selling price
    ingredients: escandallo.ingredients.map(ing => ing.ingredient_name).join(', '),
    preparation_time: 30, // Default time
    allergens: escandallo.allergens || []
  });

  const handlePublish = async () => {
    try {
      setPublishing(true);

      // Check if already exists
      const { data: existingItem } = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('hotel_id', hotelId)
        .eq('name', formData.name)
        .single();

      if (existingItem) {
        toast({
          title: "Plato ya existe",
          description: `Ya existe un plato llamado "${formData.name}" en el menú`,
          variant: "destructive",
        });
        return;
      }

      // Insert new menu item
      const { error } = await supabase
        .from('menu_items')
        .insert({
          hotel_id: hotelId,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          ingredients: formData.ingredients,
          preparation_time: formData.preparation_time,
          allergens: formData.allergens.length > 0 ? formData.allergens : null,
          image_url: escandallo.image_url || null,
          available: true
        });

      if (error) throw error;

      // Update escandallo to link with menu item (optional)
      const { data: newMenuItem } = await supabase
        .from('menu_items')
        .select('id')
        .eq('hotel_id', hotelId)
        .eq('name', formData.name)
        .single();

      if (newMenuItem) {
        await supabase
          .from('recipe_scandallos')
          .update({ menu_item_id: newMenuItem.id })
          .eq('id', escandallo.id);
      }

      toast({
        title: "¡Éxito!",
        description: `El plato "${formData.name}" ha sido publicado en el menú`,
      });

      onOpenChange(false);
      onPublished();
    } catch (error) {
      console.error('Error publishing to menu:', error);
      toast({
        title: "Error",
        description: "Error al publicar el plato en el menú",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Publicar Plato en Menú
          </DialogTitle>
          <DialogDescription>
            Revisa y ajusta los datos antes de publicar el escandallo como un plato del menú
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre del Plato</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="price">Precio de Venta (€)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="ingredients">Ingredientes</Label>
            <Textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="preparation_time">Tiempo de Preparación (minutos)</Label>
            <Input
              id="preparation_time"
              type="number"
              value={formData.preparation_time}
              onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: parseInt(e.target.value) || 0 }))}
            />
          </div>

          {formData.allergens.length > 0 && (
            <div>
              <Label>Alérgenos</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.allergens.map((allergen, index) => (
                  <Badge key={index} variant="outline" className="bg-red-50 border-red-200">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Costo de Producción:</span>
                <div className="font-bold text-red-600">€{escandallo.total_cost?.toFixed(2) || '0.00'}</div>
              </div>
              <div>
                <span className="text-gray-600">Precio de Venta:</span>
                <div className="font-bold text-green-600">€{formData.price.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">Margen de Beneficio:</span>
                <div className="font-bold text-blue-600">
                  {((formData.price - (escandallo.total_cost || 0)) / formData.price * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Publicando...' : 'Publicar en Menú'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishToMenuDialog;
