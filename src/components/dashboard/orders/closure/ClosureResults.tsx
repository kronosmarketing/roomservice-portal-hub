
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Printer } from "lucide-react";
import { ClosureData } from "./types";

interface ClosureResultsProps {
  closureData: ClosureData;
  onDownload: () => void;
  onReprint: () => void;
  onClose: () => void;
}

const ClosureResults = ({ closureData, onDownload, onReprint, onClose }: ClosureResultsProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-green-600">¡Cierre Z Completado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Pedidos archivados:</span>
            <span className="font-bold">{closureData.totalPedidos}</span>
          </div>
          <div className="flex justify-between">
            <span>Completados:</span>
            <span className="font-bold text-green-600">{closureData.pedidosCompletados}</span>
          </div>
          <div className="flex justify-between">
            <span>Cancelados:</span>
            <span className="font-bold text-red-600">{closureData.pedidosCancelados}</span>
          </div>
          <div className="flex justify-between">
            <span>Eliminados:</span>
            <span className="font-bold text-gray-600">{closureData.pedidosEliminados}</span>
          </div>
          <div className="flex justify-between">
            <span>Total final:</span>
            <span className="font-bold text-green-600">€{closureData.totalDinero.toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-600">
            Fecha: {closureData.fecha}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={onDownload} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Descargar
        </Button>
        <Button 
          onClick={onReprint} 
          variant="outline"
          className="flex-1"
        >
          <Printer className="h-4 w-4 mr-2" />
          Reimprimir
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default ClosureResults;
