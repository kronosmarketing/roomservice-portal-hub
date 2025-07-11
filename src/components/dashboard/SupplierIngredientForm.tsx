
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Calculator } from "lucide-react";
import { useState, useEffect } from "react";

interface RecipeIngredient {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  supplier_product_id?: string;
  type?: 'manual' | 'supplier'; // Add type property
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
  { value: 'g', label: 'Gramos (g)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'pcs', label: 'Piezas (pcs)' },
  { value: 'tsp', label: 'Cucharaditas (tsp)' },
  { value: 'tbsp', label: 'Cucharadas (tbsp)' },
  { value: 'cup', label: 'Tazas (cup)' }
];

// Conversion factors to base units (grams for weight, ml for volume)
const CONVERSION_FACTORS: { [key: string]: { factor: number; baseUnit: string } } = {
  'g': { factor: 1, baseUnit: 'g' },
  'kg': { factor: 1000, baseUnit: 'g' },
  'ml': { factor: 1, baseUnit: 'ml' },
  'l': { factor: 1000, baseUnit: 'ml' },
  'tsp': { factor: 5, baseUnit: 'ml' },
  'tbsp': { factor: 15, baseUnit: 'ml' },
  'cup': { factor: 240, baseUnit: 'ml' }
};

const SupplierIngredientForm = ({ 
  ingredient, 
  index, 
  supplierProducts, 
  onUpdate, 
  onRemove 
}: SupplierIngredientFormProps) => {
  // Estados locales para manejo de inputs temporalmente vacíos
  const [tempQuantity, setTempQuantity] = useState<string>(ingredient.quantity?.toString() || '1');
  const [tempUnitCost, setTempUnitCost] = useState<string>(ingredient.unit_cost?.toString() || '0');

  // CORRECCIÓN CRÍTICA: Usar la propiedad type para detectar correctamente ingredientes de proveedor
  const isSupplierIngredient = ingredient.type === 'supplier';
  
  const selectedProduct = supplierProducts.find(p => p.id === ingredient.supplier_product_id);

  console.log('SupplierIngredientForm Debug:', {
    ingredientId: ingredient.id,
    type: ingredient.type,
    supplier_product_id: ingredient.supplier_product_id,
    isSupplierIngredient,
    selectedProduct: selectedProduct?.name || 'No seleccionado',
    quantity: ingredient.quantity,
    unit: ingredient.unit
  });

  // Sincronizar estados locales cuando el ingrediente cambie
  useEffect(() => {
    setTempQuantity(ingredient.quantity?.toString() || '1');
    setTempUnitCost(ingredient.unit_cost?.toString() || '0');
  }, [ingredient.quantity, ingredient.unit_cost]);

  const handleSupplierProductChange = (productId: string) => {
    console.log('🔄 Seleccionando producto:', productId);
    const product = supplierProducts.find(p => p.id === productId);
    
    if (product) {
      console.log('📦 Producto encontrado:', {
        name: product.name,
        price: product.price,
        package_size: product.package_size,
        unit: product.unit,
        supplier: product.supplier.name
      });

      // Actualizar todos los campos de forma atómica
      onUpdate(index, 'supplier_product_id', productId);
      onUpdate(index, 'ingredient_name', product.name);
      onUpdate(index, 'unit', product.unit);
      
      // Calcular costo inmediatamente después de la actualización
      setTimeout(() => {
        calculateCost(ingredient.quantity, product.unit, product);
      }, 0);
    }
  };

  const calculateCost = (quantity: number, unit: string, product?: SupplierProduct) => {
    const currentProduct = product || selectedProduct;
    if (!currentProduct || !quantity || quantity <= 0) {
      console.log('❌ No se puede calcular costo:', { currentProduct: !!currentProduct, quantity });
      onUpdate(index, 'unit_cost', 0);
      onUpdate(index, 'total_cost', 0);
      return;
    }

    // Get conversion factors
    const usedUnitConversion = CONVERSION_FACTORS[unit];
    const packageUnitConversion = CONVERSION_FACTORS[currentProduct.unit];

    if (!usedUnitConversion || !packageUnitConversion || 
        usedUnitConversion.baseUnit !== packageUnitConversion.baseUnit) {
      console.log('❌ No se puede convertir entre unidades incompatibles');
      onUpdate(index, 'unit_cost', 0);
      onUpdate(index, 'total_cost', 0);
      return;
    }

    // Convert used quantity to base unit
    const usedQuantityInBaseUnit = quantity * usedUnitConversion.factor;
    
    // Convert package size to base unit
    const packageSizeInBaseUnit = currentProduct.package_size * packageUnitConversion.factor;
    
    // Calculate unit cost (price per base unit)
    const pricePerBaseUnit = currentProduct.price / packageSizeInBaseUnit;
    
    // Calculate total cost
    const totalCost = usedQuantityInBaseUnit * pricePerBaseUnit;
    
    console.log('💰 Cálculo de costo:', {
      quantity,
      unit,
      usedQuantityInBaseUnit,
      packageSizeInBaseUnit,
      pricePerBaseUnit,
      totalCost
    });
    
    onUpdate(index, 'unit_cost', pricePerBaseUnit);
    onUpdate(index, 'total_cost', totalCost);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempQuantity(value);
  };

  const handleQuantityBlur = () => {
    const numValue = tempQuantity === '' ? 1 : parseFloat(tempQuantity);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate(index, 'quantity', numValue);
      if (isSupplierIngredient && selectedProduct) {
        calculateCost(numValue, ingredient.unit);
      } else if (!isSupplierIngredient) {
        // Para ingredientes manuales, recalcular costo total
        const totalCost = numValue * ingredient.unit_cost;
        onUpdate(index, 'total_cost', totalCost);
      }
    } else {
      setTempQuantity('1');
      onUpdate(index, 'quantity', 1);
    }
  };

  const handleUnitChange = (unit: string) => {
    onUpdate(index, 'unit', unit);
    if (isSupplierIngredient && selectedProduct) {
      calculateCost(ingredient.quantity, unit);
    } else if (!isSupplierIngredient) {
      // Para ingredientes manuales, solo recalcular costo total
      const totalCost = ingredient.quantity * ingredient.unit_cost;
      onUpdate(index, 'total_cost', totalCost);
    }
  };

  const handleUnitCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempUnitCost(value);
  };

  const handleUnitCostBlur = () => {
    const numValue = tempUnitCost === '' ? 0 : parseFloat(tempUnitCost);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate(index, 'unit_cost', numValue);
      const totalCost = ingredient.quantity * numValue;
      onUpdate(index, 'total_cost', totalCost);
    } else {
      setTempUnitCost('0');
      onUpdate(index, 'unit_cost', 0);
    }
  };

  const getConversionDisplay = () => {
    if (!selectedProduct || !ingredient.quantity) return null;

    const usedUnitConversion = CONVERSION_FACTORS[ingredient.unit];
    const packageUnitConversion = CONVERSION_FACTORS[selectedProduct.unit];

    if (!usedUnitConversion || !packageUnitConversion || 
        usedUnitConversion.baseUnit !== packageUnitConversion.baseUnit) {
      return "No se puede convertir entre unidades incompatibles";
    }

    const usedQuantityInBaseUnit = ingredient.quantity * usedUnitConversion.factor;
    const packageSizeInBaseUnit = selectedProduct.package_size * packageUnitConversion.factor;
    const ratio = usedQuantityInBaseUnit / packageSizeInBaseUnit;

    return `${ingredient.quantity} ${ingredient.unit} → ${usedQuantityInBaseUnit} ${usedUnitConversion.baseUnit} = ${ratio.toFixed(4)} del paquete`;
  };

  return (
    <Card className={`${isSupplierIngredient ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">
            {isSupplierIngredient ? 'Ingrediente de Proveedor' : 'Ingrediente Manual'}
          </h4>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isSupplierIngredient ? (
            <div className="md:col-span-2">
              <Label>Producto de Proveedor</Label>
              <Select 
                value={ingredient.supplier_product_id || ''} 
                onValueChange={handleSupplierProductChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {supplierProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.supplier.name} (€{product.price}/{product.package_size}{product.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="md:col-span-2">
              <Label>Nombre del Ingrediente</Label>
              <Input
                value={ingredient.ingredient_name}
                onChange={(e) => onUpdate(index, 'ingredient_name', e.target.value)}
                placeholder="Ej: Harina de trigo"
              />
            </div>
          )}
        </div>

        {selectedProduct && isSupplierIngredient && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-blue-100 rounded-lg">
            <div>
              <Label className="text-xs text-gray-600">Producto Seleccionado</Label>
              <p className="font-medium">{selectedProduct.name}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Proveedor</Label>
              <p className="font-medium">{selectedProduct.supplier.name}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Cantidad del Paquete</Label>
              <p className="font-medium">{selectedProduct.package_size} {selectedProduct.unit}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Precio del Paquete</Label>
              <p className="font-medium">€{selectedProduct.price.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Cantidad Usada</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={tempQuantity}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              placeholder="1"
            />
          </div>

          <div>
            <Label>Unidad</Label>
            <Select value={ingredient.unit} onValueChange={handleUnitChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isSupplierIngredient && (
            <div>
              <Label>Costo Unitario (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={tempUnitCost}
                onChange={handleUnitCostChange}
                onBlur={handleUnitCostBlur}
                placeholder="0"
              />
            </div>
          )}
        </div>

        {selectedProduct && isSupplierIngredient && ingredient.quantity > 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Cálculo de Costo (con conversión)</span>
              </div>
              
              <div className="text-sm space-y-1 text-green-700">
                <p><strong>Conversión:</strong> {getConversionDisplay()}</p>
                <p><strong>Precio base:</strong> €{(ingredient.unit_cost || 0).toFixed(4)}/{ingredient.unit}</p>
              </div>
              
              <div className="mt-2 text-lg font-bold text-green-800">
                Costo Total: €{ingredient.total_cost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        )}

        {!isSupplierIngredient && (
          <div className="text-right">
            <span className="text-lg font-semibold">
              Total: €{ingredient.total_cost.toFixed(2)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierIngredientForm;
