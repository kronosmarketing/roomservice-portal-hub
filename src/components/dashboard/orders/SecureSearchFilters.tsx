
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { sanitizeInput, validateRoomNumber, validateOrderId } from "./securityUtils";
import { useToast } from "@/hooks/use-toast";

interface SecureSearchFiltersProps {
  onFiltersChange: (filters: {
    searchTerm: string;
    statusFilter: string;
    roomFilter: string;
  }) => void;
  onValidationError: (error: string) => void;
}

const SecureSearchFilters = ({ onFiltersChange, onValidationError }: SecureSearchFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [roomFilter, setRoomFilter] = useState("");
  const { toast } = useToast();

  const validateAndSanitizeFilters = () => {
    // Sanitize search term
    const sanitizedSearchTerm = sanitizeInput(searchTerm);
    
    // Validate room number if provided
    if (roomFilter && !validateRoomNumber(roomFilter)) {
      const error = "Número de habitación inválido";
      onValidationError(error);
      toast({
        title: "Error de validación",
        description: error,
        variant: "destructive"
      });
      return false;
    }

    // Validate search term if it looks like an order ID
    if (sanitizedSearchTerm && sanitizedSearchTerm.length >= 8 && !validateOrderId(sanitizedSearchTerm)) {
      // Only validate as order ID if it looks like a UUID
      if (sanitizedSearchTerm.includes('-') || sanitizedSearchTerm.length === 32) {
        const error = "Formato de ID de pedido inválido";
        onValidationError(error);
        toast({
          title: "Error de validación",
          description: error,
          variant: "destructive"
        });
        return false;
      }
    }

    return {
      searchTerm: sanitizedSearchTerm,
      statusFilter,
      roomFilter: sanitizeInput(roomFilter)
    };
  };

  const handleSearch = () => {
    const validatedFilters = validateAndSanitizeFilters();
    if (validatedFilters) {
      onFiltersChange(validatedFilters);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setStatusFilter("todos");
    setRoomFilter("");
    onFiltersChange({
      searchTerm: "",
      statusFilter: "todos",
      roomFilter: ""
    });
  };

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Buscar por ID de pedido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxLength={100}
        />
      </div>
      
      <div className="min-w-[150px]">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_preparacion">En preparación</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[150px]">
        <Input
          placeholder="Número de habitación"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          maxLength={20}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSearch}>
          Buscar
        </Button>
        <Button variant="outline" onClick={handleClear}>
          Limpiar
        </Button>
      </div>
    </div>
  );
};

export default SecureSearchFilters;
