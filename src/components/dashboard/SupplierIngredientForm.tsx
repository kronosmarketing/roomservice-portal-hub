import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Calculator } from "lucide-react";
import { useState, useEffect } from "react";
import { RecipeIngredient } from "./orders/types";

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
  const isSupplierIngredient = ingredient.type === 'supplier';
  const selectedProduct = supplierProducts.find(p => p.id === ingredient.supplier_product_id);

  console.log('🔄 SupplierIngredientForm Debug:', {
    index,
    type: ingredient.type,
    isSupplierIngredient,
    ingredient_name: ingredient.ingredient_name,
    supplier_product_id: ingredient.supplier_product_id,
    selectedProduct: selectedProduct?.name || 'No seleccionado',
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    package_quantity: ingredient.package_quantity,
    package_price: ingredient.package_price
  });

  const handleSupplierProductChange = (productId: string) => {
    console.log('🔄 Seleccionando producto de proveedor:', productId);
    const product = supplierProducts.find(p => p.id === productId);
    
    if (product) {
      console.log('📦 Producto encontrado:', {
        name: product.name,
        price: product.price,
        package_size: product.package_size,
        unit: product.unit,
        supplier: product.supplier.name
      });

      // Actualizar todos los campos de forma secuencial
      onUpdate(index, 'supplier_product_id', productId);
      onUpdate(index, 'ingredient_name', product.name);
      onUpdate(index, 'unit', product.unit);
      
      // Calcular costo inmediatamente
      setTimeout(() => {
        calculateSupplierCost(ingredient.quantity, product.unit, product);
      }, 100);
    }
  };

  const calculateSupplierCost = (quantity: number, unit: string, product?: SupplierProduct) => {
    const currentProduct = product || selectedProduct;
    if (!currentProduct || !quantity || quantity <= 0) {
      console.log('❌ No se puede calcular costo de proveedor');
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
    
    console.log('💰 Cálculo de costo de proveedor:', {
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

  const calculateManualCost = () => {
    const packageQty = ingredient.package_quantity || 1;
    const packagePrice = ingredient.package_price || 0;
    const usedQuantity = ingredient.quantity || 0;

    if (packageQty > 0 && packagePrice > 0 && usedQuantity > 0) {
      // Calcular proporción usada
      const proportion = usedQuantity / packageQty;
      
      // Calcular costo unitario (precio por unidad usada)
      const unitCost = packagePrice / packageQty;
      
      // Calcular costo total
      const totalCost = usedQuantity * unitCost;

      console.log('💰 Cálculo de costo manual:', {
        packageQty,
        packagePrice,
        usedQuantity,
        proportion,
        unitCost,
        totalCost
      });

      onUpdate(index, 'unit_cost', unitCost);
      onUpdate(index, 'total_cost', totalCost);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate(index, 'quantity', numValue);
      
      // Recalcular costos
      if (isSupplierIngredient && selectedProduct) {
        calculateSupplierCost(numValue, ingredient.unit);
      } else if (!isSupplierIngredient) {
        calculateManualCost();
      }
    }
  };

  const handleUnitChange = (unit: string) => {
    onUpdate(index, 'unit', unit);
    
    if (isSupplierIngredient && selectedProduct) {
      calculateSupplierCost(ingredient.quantity, unit);
    } else if (!isSupplierIngredient) {
      calculateManualCost();
    }
  };

  const handlePackageQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate(index, 'package_quantity', numValue);
      calculateManualCost();
    }
  };

  const handlePackagePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdate(index, 'package_price', numValue);
      calculateManualCost();
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

  const getManualProportionDisplay = () => {
    const packageQty = ingredient.package_quantity || 1;
    const usedQuantity = ingredient.quantity || 0;
    
    if (packageQty > 0 && usedQuantity > 0) {
      const percentage = (usedQuantity / packageQty) * 100;
      return `${usedQuantity} / ${packageQty} = ${percentage.toFixed(2)}%`;
    }
    
    return null;
  };

  return (
    <Card className={`${isSupplierIngredient ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
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
              value={ingredient.quantity || ''}
              onChange={handleQuantityChange}
              placeholder="0"
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
              <Label>Cantidad de Referencia</Label>
              <div className="flex">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ingredient.package_quantity || ''}
                  onChange={handlePackageQuantityChange}
                  placeholder="1000"
                  className="rounded-r-none"
                />
                <div className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-md px-3 py-2 text-sm text-gray-600 min-w-[60px] flex items-center justify-center">
                  {ingredient.unit}
                </div>
              </div>
            </div>
          )}
        </div>

        {!isSupplierIngredient && (
          <div>
            <Label>Precio del Paquete (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={ingredient.package_price || ''}
              onChange={handlePackagePriceChange}
              placeholder="0"
            />
          </div>
        )}

        {!isSupplierIngredient && getManualProportionDisplay() && (
          <Card className="bg-green-100 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Cálculo de Costo Manual</span>
              </div>
              
              <div className="text-sm space-y-1 text-green-700">
                <p><strong>Proporción usada:</strong> {getManualProportionDisplay()}</p>
                <p><strong>Costo base:</strong> €{(ingredient.unit_cost || 0).toFixed(4)}/{ingredient.unit}</p>
              </div>
              
              <div className="mt-2 text-lg font-bold text-green-800">
                Costo Total: €{ingredient.total_cost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedProduct && isSupplierIngredient && ingredient.quantity > 0 && (
          <Card className="bg-blue-100 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Cálculo de Costo (con conversión)</span>
              </div>
              
              <div className="text-sm space-y-1 text-blue-700">
                <p><strong>Conversión:</strong> {getConversionDisplay()}</p>
                <p><strong>Precio base:</strong> €{(ingredient.unit_cost || 0).toFixed(4)}/{ingredient.unit}</p>
              </div>
              
              <div className="mt-2 text-lg font-bold text-blue-800">
                Costo Total: €{ingredient.total_cost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierIngredientForm;
