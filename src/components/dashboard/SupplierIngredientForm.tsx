
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Calculator } from "lucide-react";

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

interface SupplierIngredientFormProps {
  ingredient: RecipeIngredient;
  index: number;
  supplierProducts: SupplierProduct[];
  onUpdate: (index: number, field: keyof RecipeIngredient, value: any) => void;
  onRemove: (index: number) => void;
}

const UNIT_OPTIONS = [
  { value: "g", label: "Gramos (g)" },
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "l", label: "Litros (l)" },
  { value: "ud", label: "Unidades (ud)" },
  { value: "cups", label: "Tazas" },
  { value: "tbsp", label: "Cucharadas" },
  { value: "tsp", label: "Cucharaditas" }
];

const UNIT_CONVERSIONS: { [key: string]: { [key: string]: number } } = {
  "kg": { "g": 1000 },
  "g": { "kg": 0.001 },
  "l": { "ml": 1000 },
  "ml": { "l": 0.001 }
};

const SupplierIngredientForm = ({ ingredient, index, supplierProducts, onUpdate, onRemove }: SupplierIngredientFormProps) => {
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null);
  const [usedQuantity, setUsedQuantity] = useState<number>(ingredient.quantity);
  const [usedUnit, setUsedUnit] = useState<string>(ingredient.unit);
  const [conversionInfo, setConversionInfo] = useState<string>("");

  useEffect(() => {
    if (ingredient.supplier_product_id) {
      const product = supplierProducts.find(p => p.id === ingredient.supplier_product_id);
      setSelectedProduct(product || null);
    }
  }, [ingredient.supplier_product_id, supplierProducts]);

  useEffect(() => {
    if (selectedProduct && usedQuantity && usedUnit) {
      calculateCost();
    }
  }, [selectedProduct, usedQuantity, usedUnit]);

  const calculateCost = () => {
    if (!selectedProduct) return;

    const packageUnit = selectedProduct.unit;
    const packageSize = selectedProduct.package_size;
    const packagePrice = selectedProduct.price;

    let finalQuantity = usedQuantity;
    let conversionText = "";

    // Apply unit conversion if needed
    if (usedUnit !== packageUnit && UNIT_CONVERSIONS[usedUnit]?.[packageUnit]) {
      const conversionFactor = UNIT_CONVERSIONS[usedUnit][packageUnit];
      finalQuantity = usedQuantity * conversionFactor;
      conversionText = `${usedQuantity} ${usedUnit} → ${finalQuantity} ${packageUnit}`;
      setConversionInfo(conversionText);
    } else if (usedUnit === packageUnit) {
      setConversionInfo(`${usedQuantity} ${usedUnit} (sin conversión)`);
    } else {
      setConversionInfo("⚠️ Unidades incompatibles");
      return;
    }

    // Calculate unit cost and total cost
    const unitCost = packagePrice / packageSize;
    const totalCost = finalQuantity * unitCost;

    onUpdate(index, 'quantity', usedQuantity);
    onUpdate(index, 'unit', usedUnit);
    onUpdate(index, 'unit_cost', unitCost);
    onUpdate(index, 'total_cost', totalCost);
  };

  const handleProductSelect = (productId: string) => {
    const product = supplierProducts.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      onUpdate(index, 'supplier_product_id', productId);
      onUpdate(index, 'ingredient_name', product.name);
      setUsedUnit(product.unit); // Default to package unit
    }
  };

  const isSupplierIngredient = ingredient.supplier_product_id !== undefined;

  if (isSupplierIngredient) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-800">
              Ingrediente de Proveedor
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Producto de Proveedor</Label>
            <Select value={ingredient.supplier_product_id || ""} onValueChange={handleProductSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {supplierProducts.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-gray-500">
                        {product.supplier.name} - Ref: {product.reference || 'N/A'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cantidad del Paquete</Label>
                  <Input
                    value={`${selectedProduct.package_size} ${selectedProduct.unit}`}
                    readOnly
                    className="bg-gray-100 text-gray-600"
                  />
                </div>
                <div>
                  <Label>Precio del Paquete</Label>
                  <Input
                    value={`€${selectedProduct.price.toFixed(2)}`}
                    readOnly
                    className="bg-gray-100 text-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cantidad Usada</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={usedQuantity}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setUsedQuantity(value);
                    }}
                    className="font-medium"
                  />
                </div>
                <div>
                  <Label>Unidad</Label>
                  <Select value={usedUnit} onValueChange={setUsedUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Cálculo de Costo (con conversión)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Conversión: </span>
                    <span className="font-medium">{conversionInfo}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Precio base: </span>
                    <span className="font-medium">€{(selectedProduct.price / selectedProduct.package_size).toFixed(4)}/{selectedProduct.unit}</span>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    Costo Total: €{ingredient.total_cost.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Manual ingredient (original layout)
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="grid grid-cols-6 gap-2 items-end">
          <div>
            <Label>Ingrediente</Label>
            <Input
              value={ingredient.ingredient_name}
              onChange={(e) => onUpdate(index, 'ingredient_name', e.target.value)}
              placeholder="Nombre del ingrediente"
            />
          </div>
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              step="0.01"
              value={ingredient.quantity}
              onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Unidad</Label>
            <Select value={ingredient.unit} onValueChange={(value) => onUpdate(index, 'unit', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map(unit => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Precio/Unidad (€)</Label>
            <Input
              type="number"
              step="0.001"
              value={ingredient.unit_cost}
              onChange={(e) => onUpdate(index, 'unit_cost', parseFloat(e.target.value) || 0)}
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
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierIngredientForm;
