
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";

interface RecipeStep {
  id: string;
  step_number: number;
  description: string;
  time_minutes?: number;
  temperature?: number;
}

interface RecipeStepsManagerProps {
  steps: RecipeStep[];
  onStepsChange: (steps: RecipeStep[]) => void;
}

const RecipeStepsManager = ({ steps, onStepsChange }: RecipeStepsManagerProps) => {
  const addStep = () => {
    const newStep: RecipeStep = {
      id: `temp-${Date.now()}`,
      step_number: steps.length + 1,
      description: "",
      time_minutes: undefined,
      temperature: undefined
    };
    onStepsChange([...steps, newStep]);
  };

  const updateStep = (index: number, field: keyof RecipeStep, value: any) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    onStepsChange(updatedSteps);
  };

  const removeStep = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    // Renumerar los pasos
    const renumberedSteps = updatedSteps.map((step, i) => ({
      ...step,
      step_number: i + 1
    }));
    onStepsChange(renumberedSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const updatedSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedSteps[index], updatedSteps[targetIndex]] = 
    [updatedSteps[targetIndex], updatedSteps[index]];
    
    // Renumerar los pasos
    const renumberedSteps = updatedSteps.map((step, i) => ({
      ...step,
      step_number: i + 1
    }));
    
    onStepsChange(renumberedSteps);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Pasos de la Receta</CardTitle>
          <Button type="button" onClick={addStep} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Añadir Paso
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No hay pasos definidos. Añade el primer paso de la receta.
          </div>
        ) : (
          steps.map((step, index) => (
            <div key={step.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Paso {step.step_number}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === steps.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeStep(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor={`step-description-${index}`}>Descripción</Label>
                <Textarea
                  id={`step-description-${index}`}
                  placeholder="Describe este paso de la receta..."
                  value={step.description}
                  onChange={(e) => updateStep(index, 'description', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`step-time-${index}`}>Tiempo (minutos)</Label>
                  <Input
                    id={`step-time-${index}`}
                    type="number"
                    min="0"
                    placeholder="Opcional"
                    value={step.time_minutes || ''}
                    onChange={(e) => updateStep(index, 'time_minutes', 
                      e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor={`step-temperature-${index}`}>Temperatura (°C)</Label>
                  <Input
                    id={`step-temperature-${index}`}
                    type="number"
                    min="0"
                    placeholder="Opcional"
                    value={step.temperature || ''}
                    onChange={(e) => updateStep(index, 'temperature', 
                      e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RecipeStepsManager;
