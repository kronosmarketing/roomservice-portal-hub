
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator, Clock, DollarSign, Users } from "lucide-react";

interface RecipeDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: {
    id: string;
    name: string;
    portions: number;
    total_cost: number;
    selling_price: number;
    profit_margin: number;
    notes: string;
    image_url?: string;
    allergens?: string[];
    ingredients: Array<{
      id: string;
      ingredient_name: string;
      quantity: number;
      unit: string;
      unit_cost: number;
      total_cost: number;
    }>;
  };
}

const RecipeDetailView = ({ open, onOpenChange, recipe }: RecipeDetailViewProps) => {
  const costPerPortion = recipe.total_cost / recipe.portions;
  const pricePerPortion = recipe.selling_price / recipe.portions;
  const profitPerPortion = pricePerPortion - costPerPortion;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Section */}
          {recipe.image_url && (
            <div className="space-y-2">
              <img 
                src={recipe.image_url} 
                alt={recipe.name}
                className="w-full h-64 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Porciones:</span>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {recipe.portions}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Costo Total:</span>
                  <span className="font-bold text-green-600">€{recipe.total_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Precio Venta:</span>
                  <span className="font-bold text-blue-600">€{recipe.selling_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Margen:</span>
                  <Badge variant={recipe.profit_margin > 20 ? "default" : "destructive"}>
                    {recipe.profit_margin.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Per Portion Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Análisis por Porción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Costo/Porción:</span>
                  <span className="font-bold text-green-600">€{costPerPortion.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Precio/Porción:</span>
                  <span className="font-bold text-blue-600">€{pricePerPortion.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Beneficio/Porción:</span>
                  <span className="font-bold text-purple-600">€{profitPerPortion.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ingredients Section */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{ingredient.ingredient_name}</span>
                    <div className="text-sm text-gray-600">
                      {ingredient.quantity} {ingredient.unit} × €{ingredient.unit_cost.toFixed(3)}/{ingredient.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">€{ingredient.total_cost.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {((ingredient.total_cost / recipe.total_cost) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Allergens */}
        {recipe.allergens && recipe.allergens.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Alérgenos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recipe.allergens.map((allergen, index) => (
                  <Badge key={index} variant="outline" className="bg-red-50 border-red-200">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {recipe.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{recipe.notes}</p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecipeDetailView;
